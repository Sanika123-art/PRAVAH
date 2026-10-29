import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  createApplicationDraft,
  updateApplicationDraft,
  getInstitutionApplication,
  getCategoryChecklist,
  uploadApplicationDocument,
  runPreliminaryChecks,
  submitApplication,
  ChecklistItemStatus,
  PreliminaryCheckResult,
} from '../../services/institutionService';
import { ApplicationCategory, DocumentType } from '@saksham/shared';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Upload,
  FileText,
  Building2,
  Layers,
  ShieldCheck,
  Send,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

const STEPS = [
  { id: 1, title: 'Category & Cycle', desc: 'Select regulatory category' },
  { id: 2, title: 'Institution Info', desc: 'Review campus registration' },
  { id: 3, title: 'Programmes & Intake', desc: 'Capacity and land metrics' },
  { id: 4, title: 'Document Checklist', desc: 'Upload statutory documents' },
  { id: 5, title: 'Preliminary Validation', desc: 'Rule compliance checks' },
  { id: 6, title: 'Submit to PRAVAH', desc: 'Confirm and dispatch' },
];

export const NewApplicationWizardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftIdParam = searchParams.get('draftId');

  const [currentStep, setCurrentStep] = useState(1);
  const [applicationId, setApplicationId] = useState<string | null>(draftIdParam);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<ApplicationCategory>('NEW_INSTITUTE');
  const [academicCycle, setAcademicCycle] = useState('2026-27');
  const [requestedIntake, setRequestedIntake] = useState(240);
  const [landAreaAcres, setLandAreaAcres] = useState(7.5);
  const [programName, setProgramName] = useState('Engineering & Technology');
  const [courses, setCourses] = useState([
    { name: 'Computer Science & Engineering', intake: 120, level: 'Under Graduate' },
    { name: 'Electronics & Communication Engineering', intake: 60, level: 'Under Graduate' },
    { name: 'Mechanical Engineering', intake: 60, level: 'Under Graduate' },
  ]);

  // Checklist & Validation State
  const [checklist, setChecklist] = useState<ChecklistItemStatus[]>([]);
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [preliminaryResults, setPreliminaryResults] = useState<PreliminaryCheckResult | null>(null);

  // Load existing draft if draftId provided
  useEffect(() => {
    if (draftIdParam) {
      const loadDraft = async () => {
        try {
          const app = await getInstitutionApplication(draftIdParam);
          setApplicationId(app.id);
          setCategory(app.category);
          setAcademicCycle(app.academicCycle || '2026-27');
          setRequestedIntake(app.requestedIntake || 240);
          setLandAreaAcres(app.landAreaAcres || 5.0);
          if (app.draftData) {
            const data: any = app.draftData;
            if (data.programName) setProgramName(data.programName);
            if (data.courses) setCourses(data.courses);
            if (data.step) setCurrentStep(data.step);
          }
        } catch (err) {
          console.error('Failed to load draft:', err);
        }
      };
      loadDraft();
    }
  }, [draftIdParam]);

  // Load category checklist when reaching Step 4
  const refreshChecklist = async (appId: string) => {
    try {
      const items = await getCategoryChecklist(appId);
      setChecklist(items);
    } catch (err) {
      console.error('Failed to load checklist:', err);
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const draftPayload = {
        category,
        academicCycle,
        requestedIntake: Number(requestedIntake),
        landAreaAcres: Number(landAreaAcres),
        draftData: {
          programName,
          courses,
          step: currentStep,
        },
      };

      if (!applicationId) {
        const created = await createApplicationDraft(draftPayload);
        setApplicationId(created.id);
        setSuccessMessage('Application draft created successfully.');
      } else {
        await updateApplicationDraft(applicationId, draftPayload);
        setSuccessMessage('Draft updated and saved.');
      }
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    setErrorMessage(null);

    // Save draft at every step transition
    setIsSaving(true);
    try {
      const draftPayload = {
        category,
        academicCycle,
        requestedIntake: Number(requestedIntake),
        landAreaAcres: Number(landAreaAcres),
        draftData: {
          programName,
          courses,
          step: currentStep + 1,
        },
      };

      let activeId = applicationId;
      if (!activeId) {
        const created = await createApplicationDraft(draftPayload);
        activeId = created.id;
        setApplicationId(created.id);
      } else {
        await updateApplicationDraft(activeId, draftPayload);
      }

      if (currentStep === 3) {
        // Prepare checklist for Step 4
        await refreshChecklist(activeId);
      } else if (currentStep === 4) {
        // Run preliminary checks for Step 5
        const res = await runPreliminaryChecks(activeId);
        setPreliminaryResults(res);
      } else if (currentStep === 5 && !preliminaryResults?.passed) {
        setErrorMessage('Resolve every mandatory document verification issue before continuing.');
        return;
      }

      setCurrentStep((prev) => Math.min(prev + 1, 6));
    } catch (err: any) {
      setErrorMessage(err.message || 'Error navigating to next step.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: DocumentType) => {
    if (!applicationId || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploadingDocType(docType);
    setErrorMessage(null);

    try {
      const result = await uploadApplicationDocument(applicationId, file, docType);
      await refreshChecklist(applicationId);
      if (result.verificationStatus === 'VERIFIED') {
        setSuccessMessage(`Document "${file.name}" passed automated document checks. Authenticity is not established.`);
      } else {
        setErrorMessage(`${result.verificationStatus}: ${result.verificationExplanation || 'The document requires correction or authorized review.'}`);
      }
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 7000);
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed. Ensure PDF/PNG format and max 10MB.');
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleFinalSubmit = async () => {
    if (!applicationId) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitApplication(applicationId);
      navigate(`/institution/applications/${res.application.id}?submitted=true`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Submission failed. Please verify preliminary checks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-[#17202B] p-4 rounded-sm shadow-[2px_2px_0px_#17202B]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#5B6875] uppercase tracking-wider mb-1">
            <span>Institution Portal</span>
            <span>/</span>
            <span>Applications</span>
            <span>/</span>
            <span className="text-[#17202B] font-bold">New Application Wizard</span>
          </div>
          <h1 className="text-xl font-black text-[#142B45] uppercase tracking-wide">
            AICTE Approval Application Creation
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="gov-btn-secondary py-2 px-3 text-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#5B6875]" />
            <span>{isSaving ? 'Saving Draft...' : 'Save Draft Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Wizard Progress Bar */}
      <div className="bg-white p-4 border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center space-x-2.5 p-2 rounded-sm border-2 transition ${
                  isCurrent
                    ? 'bg-[#142B45] text-white border-[#17202B] shadow-[2px_2px_0px_#17202B]'
                    : isCompleted
                    ? 'bg-[#EAF0F5] text-[#17202B] border-[#17202B]'
                    : 'bg-[#FAF9F6] text-[#5B6875] border-slate-300 opacity-70'
                }`}>
                  <div
                    className={`w-7 h-7 rounded-sm border-2 flex items-center justify-center font-mono font-black text-xs ${
                      isCurrent
                        ? 'bg-[#E98232] text-white border-white'
                        : isCompleted
                        ? 'bg-[#18794E] text-white border-[#17202B]'
                        : 'bg-white text-[#5B6875] border-slate-400'
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                  </div>
                  <div>
                    <div
                      className={`text-xs font-black uppercase tracking-wider ${
                        isCurrent ? 'text-white' : 'text-[#17202B]'
                      }`}
                    >
                      {s.title}
                    </div>
                    <div className={`text-[10px] font-mono ${isCurrent ? 'text-slate-300' : 'text-[#5B6875]'}`}>
                      {s.desc}
                    </div>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-6 border-t-2 border-dashed ${
                      currentStep > idx + 1 ? 'border-[#18794E]' : 'border-slate-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3.5 rounded-sm bg-rose-50 border-2 border-rose-700 text-rose-950 text-xs flex items-start space-x-2.5 shadow-[2px_2px_0px_#b91c1c]">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700 mt-0.5" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 rounded-sm bg-emerald-50 border-2 border-[#18794E] text-emerald-950 text-xs flex items-start space-x-2.5 shadow-[2px_2px_0px_#18794E]">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#18794E] mt-0.5" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {/* Step Panels */}
      <div className="bg-white p-6 sm:p-8 border-2 border-[#17202B] rounded-sm shadow-[2px_2px_0px_#17202B] min-h-[440px] flex flex-col justify-between">
        {/* Step 1: Category & Academic Cycle */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b-2 border-[#17202B] pb-3">
              <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
                Step 1: Select Application Category & Academic Approval Cycle
              </h2>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Statutory categories configured in compliance with AICTE Approval Process Handbook (APH 2024–27).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#17202B] mb-1.5">
                  Regulatory Approval Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ApplicationCategory)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
                >
                  <option value="NEW_INSTITUTE">Establishment of New Technical Institution</option>
                  <option value="EOA_EXISTING">Extension of Approval (EoA Existing)</option>
                  <option value="INTAKE_INCREASE">Increase in Intake / Additional Course(s)</option>
                  <option value="SUPERNUMERARY_SEATS">Introduction of Supernumerary Seats (FN / OCI / NRI)</option>
                  <option value="CHANGE_OF_SITE">Change of Site / Location of Campus</option>
                  <option value="WOMEN_TO_COED">Conversion from Women's Institution to Co-Education</option>
                  <option value="CLOSURE">Progressive or Complete Closure</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#17202B] mb-1.5">
                  Academic Approval Cycle *
                </label>
                <select
                  value={academicCycle}
                  onChange={(e) => setAcademicCycle(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs font-semibold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
                >
                  <option value="2026-27">Academic Cycle 2026–27 (Current Active Cycle)</option>
                  <option value="2027-28">Academic Cycle 2027–28</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-[#EAF0F5] rounded-sm border-2 border-[#17202B] text-xs text-[#17202B] space-y-1.5 shadow-[1px_1px_0px_#17202B]">
              <div className="font-black text-[#142B45] flex items-center space-x-1.5 uppercase tracking-wide">
                <HelpCircle className="w-4 h-4 text-[#142B45]" />
                <span>Statutory Regulatory Note</span>
              </div>
              <p className="leading-relaxed">
                Each category invokes category-specific statutory document checklists and automated scrutiny parameters. For example, <strong>Establishment of New Technical Institution</strong> mandates registered 30-year land lease, occupancy certificate, fire safety clearance, and joint FDR endowment.
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Review Institution Info */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b-2 border-[#17202B] pb-3">
              <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
                Step 2: Institutional Identity & Regional Bureau Jurisdiction
              </h2>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Authoritative institutional record retrieved from PRAVAH Central Directory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5B6875]">Institution Registered Name</span>
                <p className="text-sm font-black text-[#17202B] mt-0.5">{currentUser?.institutionName}</p>
              </div>

              <div className="p-4 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5B6875]">Permanent Institute ID (PID)</span>
                <p className="text-sm font-black font-mono text-[#142B45] mt-0.5">
                  {currentUser?.permanentInstituteId || 'Will be allocated upon first approval'}
                </p>
              </div>

              <div className="p-4 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5B6875]">Regional Bureau Jurisdiction</span>
                <p className="text-sm font-black text-[#17202B] mt-0.5">
                  {currentUser?.region ? currentUser.region.replace('_', ' ') : 'National Pool (Assigned)'}
                </p>
              </div>

              <div className="p-4 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B]">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#5B6875]">Authorized Representative</span>
                <p className="text-sm font-black text-[#17202B] mt-0.5">
                  {currentUser?.fullName} ({currentUser?.email})
                </p>
              </div>
            </div>

            <p className="text-xs text-[#5B6875] font-mono">
              Note: To update permanent campus coordinates or trust details, navigate to the <span className="font-bold text-[#142B45] underline">Institution Profile</span> desk.
            </p>
          </div>
        )}

        {/* Step 3: Programmes & Intake */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b-2 border-[#17202B] pb-3">
              <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
                Step 3: Academic Capacity & Campus Infrastructure
              </h2>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Statutory intake capacity and campus land area required for physical compliance verification.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#17202B] mb-1.5">
                  Total Requested Annual Intake (Seats) *
                </label>
                <input
                  type="number"
                  min="30"
                  step="30"
                  value={requestedIntake}
                  onChange={(e) => setRequestedIntake(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
                />
                <span className="text-[10px] font-mono text-[#5B6875] mt-1 block">Standard AICTE division unit: 60 seats per division.</span>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#17202B] mb-1.5">
                  Campus Land Area in Acres *
                </label>
                <input
                  type="number"
                  min="1.0"
                  step="0.5"
                  value={landAreaAcres}
                  onChange={(e) => setLandAreaAcres(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm text-[#17202B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#142B45]"
                />
                <span className="text-[10px] font-mono text-[#5B6875] mt-1 block">APH Handbook Threshold: Urban min 2.5 acres / Rural min 7.5 acres.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-[#17202B] mb-2">
                Proposed Technical Programmes & Departmental Allocation
              </label>
              <div className="border-2 border-[#17202B] rounded-sm overflow-hidden text-xs shadow-[2px_2px_0px_#17202B]">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Course / Specialization</th>
                      <th>Level</th>
                      <th className="text-right">Requested Intake</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((c, i) => (
                      <tr key={i}>
                        <td className="font-bold text-[#17202B]">{c.name}</td>
                        <td className="text-[#5B6875]">{c.level}</td>
                        <td className="text-right font-mono font-bold text-[#142B45]">{c.intake} SEATS</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Category Document Checklist */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b-2 border-[#17202B] pb-3">
              <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
                Step 4: Statutory Document Checklist & Evidence Repository
              </h2>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Upload verified PDF/JPEG documents corresponding to AICTE APH 2024–27 regulatory clauses.
              </p>
            </div>

            <div className="space-y-3">
              {checklist.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-[#5B6875] border-2 border-dashed border-[#17202B]">
                  Retrieving statutory document checklist for selected category...
                </div>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.documentType}
                    className="p-4 rounded-sm border-2 border-[#17202B] bg-[#FAF9F6] flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-[1px_1px_0px_#17202B]"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-[#17202B] uppercase tracking-wider">{item.title}</span>
                        {item.mandatory && (
                          <span className="text-[10px] font-mono font-black px-1.5 py-0.5 bg-rose-100 text-rose-900 border border-rose-400 rounded-sm">
                            MANDATORY
                          </span>
                        )}
                        <span className="text-[10px] text-[#5B6875] font-mono font-bold">[{item.aphClause}]</span>
                      </div>
                      <p className="text-xs text-[#5B6875] mt-0.5 leading-relaxed">{item.description}</p>

                      {item.isUploaded && item.uploadedDocument && (
                        <div className={`mt-2 p-2.5 rounded-sm border-2 text-xs ${
                          item.uploadedDocument.verificationStatus === 'VERIFIED'
                            ? 'text-emerald-950 bg-emerald-50 border-[#18794E]'
                            : item.uploadedDocument.verificationStatus === 'REJECTED'
                              ? 'text-rose-950 bg-rose-50 border-rose-700'
                              : 'text-amber-950 bg-amber-50 border-amber-600'
                        }`}>
                          <div className="flex items-center space-x-1.5 font-bold">
                            {item.uploadedDocument.verificationStatus === 'VERIFIED'
                              ? <CheckCircle2 className="w-3.5 h-3.5 text-[#18794E]" />
                              : <AlertCircle className="w-3.5 h-3.5" />}
                            <span>STATUS: {item.uploadedDocument.verificationStatus}</span>
                            <span className="font-mono font-normal">| {item.uploadedDocument.fileName} ({(item.uploadedDocument.fileSize / 1024).toFixed(1)} KB)</span>
                          </div>
                          {item.uploadedDocument.verificationExplanation && (
                            <p className="mt-1 font-mono text-[11px]">{item.uploadedDocument.verificationExplanation}</p>
                          )}
                          {item.uploadedDocument.validationResults?.some((rule) => !rule.passed) && (
                            <ul className="mt-1 list-disc list-inside space-y-0.5 font-mono text-[11px]">
                              {item.uploadedDocument.validationResults
                                .filter((rule) => !rule.passed)
                                .map((rule) => <li key={rule.rule}>{rule.rule}: {rule.explanation}</li>)}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <label className="gov-btn-secondary py-1.5 px-3 text-xs cursor-pointer shadow-[2px_2px_0px_#17202B]">
                        <Upload className="w-3.5 h-3.5 text-[#142B45]" />
                        <span>{uploadingDocType === item.documentType ? 'Uploading...' : item.isUploaded ? 'Replace Document' : 'Upload File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          disabled={uploadingDocType === item.documentType}
                          onChange={(e) => handleFileUpload(e, item.documentType)}
                        />
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 5: Preliminary Validation Results */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b-2 border-[#17202B] pb-3">
              <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
                Step 5: Preliminary Regulatory Scrutiny Validation
              </h2>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Automated heuristic rule engines check mandatory completeness prior to officer queue assignment.
              </p>
            </div>

            {preliminaryResults ? (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-sm border-2 ${
                    preliminaryResults.passed
                      ? 'bg-emerald-50 border-[#18794E] text-emerald-950 shadow-[2px_2px_0px_#18794E]'
                      : 'bg-rose-50 border-rose-700 text-rose-950 shadow-[2px_2px_0px_#b91c1c]'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {preliminaryResults.passed ? (
                      <CheckCircle2 className="w-7 h-7 text-[#18794E] flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-7 h-7 text-rose-700 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide">
                        {preliminaryResults.passed
                          ? 'PRELIMINARY COMPLIANCE CHECKS SATISFIED'
                          : 'MANDATORY COMPLIANCE DEFICIENCIES DETECTED'}
                      </h3>
                      <p className="text-xs opacity-90 mt-0.5 font-medium">
                        {preliminaryResults.passed
                          ? 'All required statutory category documents and structural fields are validated. You may proceed to final dispatch.'
                          : 'Rectify the flagged deficiency items below before submission to the statutory review desk.'}
                      </p>
                    </div>
                  </div>
                </div>

                {!preliminaryResults.passed && (
                  <div className="bg-white p-4 rounded-sm border-2 border-rose-700 space-y-2 shadow-[2px_2px_0px_#b91c1c]">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-900">Action Required Prior to Submission:</span>
                    <ul className="list-disc list-inside text-xs text-rose-900 space-y-1 font-mono">
                      {preliminaryResults.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-[#EAF0F5] rounded-sm border-2 border-[#17202B] text-xs text-[#17202B] shadow-[1px_1px_0px_#17202B]">
                  <div className="font-black text-[#142B45] uppercase tracking-wide mb-1">Regulatory Safeguard Notice:</div>
                  <p className="leading-relaxed">
                    PRAVAH automated checks assist institutions and regional scrutiny officers in document verification. Automated clearance does not grant legal approval; statutory evaluation remains under authorized AICTE Scrutiny Committee authority.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-xs font-mono text-[#5B6875] border-2 border-dashed border-[#17202B]">
                Executing preliminary regulatory validation pipeline...
              </div>
            )}
          </div>
        )}

        {/* Step 6: Confirm & Submit */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="border-b-2 border-[#17202B] pb-3">
              <h2 className="text-base font-black text-[#142B45] uppercase tracking-wide">
                Step 6: Dossier Preview & Final Submission to Scrutiny Desk
              </h2>
              <p className="text-xs text-[#5B6875] mt-0.5">
                Review the submission summary. Submission assigns your application to the active scrutiny queue.
              </p>
            </div>

            <div className="p-5 bg-[#FAF9F6] rounded-sm border-2 border-[#17202B] space-y-4 text-xs shadow-[2px_2px_0px_#17202B]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Institution:</span>
                  <div className="font-bold text-[#17202B]">{currentUser?.institutionName}</div>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Regulatory Category:</span>
                  <div className="font-bold text-[#17202B]">{category.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Academic Cycle:</span>
                  <div className="font-bold font-mono text-[#17202B]">{academicCycle}</div>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Requested Intake:</span>
                  <div className="font-bold font-mono text-[#142B45]">{requestedIntake} SEATS</div>
                </div>
              </div>

              <div className="pt-3 border-t-2 border-[#17202B]">
                <span className="font-mono text-[10px] uppercase font-bold text-[#5B6875]">Attached Statutory Documents:</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {checklist
                    .filter((c) => c.isUploaded)
                    .map((c) => (
                      <span key={c.documentType} className="px-2.5 py-1 bg-white border-2 border-[#17202B] rounded-sm text-[11px] font-mono font-bold text-[#17202B]">
                        {c.title}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#EAF0F5] border-2 border-[#17202B] rounded-sm text-xs text-[#142B45] shadow-[2px_2px_0px_#17202B]">
              <div className="font-black uppercase tracking-wider mb-1">Formal Submission Declaration:</div>
              <p className="leading-relaxed">
                By clicking "Submit Application to PRAVAH", an official application reference number will be minted, and the application will be assigned to the AICTE Scrutiny Officer queue. You can monitor scrutiny progress, deficiency notices, and inspection schedules directly from your dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Wizard Bottom Navigation Buttons */}
        <div className="pt-6 border-t-2 border-[#17202B] flex justify-between items-center mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep((p) => Math.max(p - 1, 1))}
            disabled={currentStep === 1 || isSaving || isSubmitting}
            className="gov-btn-secondary py-2 px-4 text-xs disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving || (currentStep === 5 && !preliminaryResults?.passed)}
              className="gov-btn-primary py-2 px-5 text-xs disabled:opacity-50"
            >
              <span>{isSaving ? 'Processing...' : 'Continue to Next Step'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={Boolean(isSubmitting || (preliminaryResults && !preliminaryResults.passed))}
              className="gov-btn-saffron py-2.5 px-6 text-xs font-black shadow-[2px_2px_0px_#17202B] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting to Queue...' : 'Submit Application to PRAVAH'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
