import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  getApplications,
  getApplicationById,
  createDraft,
  updateDraft,
  getChecklist,
  uploadDocument,
  downloadDocumentFile,
  checkPreliminary,
  submit,
  resubmitCorrection,
  getDeficiencies,
  respondDeficiency,
  getCompliance,
  submitCompliance,
  getNotifications,
  markNotificationRead,
} from '../controllers/institutionController';
import { requireAuth, requireInstitution } from '../middleware/authMiddleware';
import { uploadDocumentFile } from '../services/documentStorageService';

const router = Router();

// Secure file streaming endpoint (allowed for authenticated institutions and authorized officers)
router.get('/applications/:id/documents/:docId/file', requireAuth, downloadDocumentFile);

// All other institution portal endpoints strictly require INSTITUTION_USER role & tenant
router.use(requireAuth, requireInstitution);

// Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Applications
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.post('/applications/draft', createDraft);
router.put('/applications/:id/draft', updateDraft);
router.get('/applications/:id/checklist', getChecklist);
router.post('/applications/:id/documents', uploadDocumentFile, uploadDocument);
router.post('/applications/:id/preliminary-checks', checkPreliminary);
router.post('/applications/:id/submit', submit);
router.post('/applications/:id/resubmit-correction', resubmitCorrection);

// Deficiencies
router.get('/deficiencies', getDeficiencies);
router.post('/deficiencies/:id/respond', respondDeficiency);

// Compliance
router.get('/compliance', getCompliance);
router.post('/compliance/:id/evidence', submitCompliance);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);

export default router;
