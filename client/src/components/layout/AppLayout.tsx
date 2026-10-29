import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { IndiaFlag, CouncilEmblem } from '../common/GovtEmblem';
import { useAuth, PRESET_USERS } from '../../context/AuthContext';
import { UserRole } from '@saksham/shared';
import { CommandPalette } from '../features/CommandPalette';
import { LanguageSelector } from '../common/LanguageSelector';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  FileText,
  GitPullRequest,
  Users,
  ShieldCheck,
  Clock,
  BarChart3,
  History,
  Scale,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  Search,
  Pause,
  Play,
  CheckCircle2,
} from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { currentUser, switchRole, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [fontSizeScale, setFontSizeScale] = useState<number>(1);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Change font scaling dynamically
  const changeFontSize = (delta: number) => {
    const newScale = Math.min(1.2, Math.max(0.85, fontSizeScale + delta));
    setFontSizeScale(newScale);
    document.documentElement.style.setProperty('--font-scale', newScale.toString());
  };

  const resetFontSize = () => {
    setFontSizeScale(1);
    document.documentElement.style.setProperty('--font-scale', '1');
  };

  const allNavItems = [
    { to: '/dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/applications', label: 'Applications Register', icon: FileText, badge: '12' },
    { to: '/workflow-queue', label: 'Scrutiny Queue', icon: GitPullRequest, badge: '5' },
    { to: '/evc', label: 'EVC Inspections', icon: Users, alert: true },
    { to: '/compliance', label: 'Compliance & Undertakings', icon: ShieldCheck, badge: '4' },
    { to: '/document-validity', label: 'Document Validity', icon: Clock, alert: true },
    { to: '/reports', label: 'Reports & Analytics', icon: BarChart3 },
    {
      to: '/audit',
      label: 'Forensic Audit Trail',
      icon: History,
      requiredRoles: ['MEMBER_SECRETARY', 'SYSTEM_ADMIN'] as UserRole[],
    },
    { to: '/admin/rules', label: 'Regulatory Rules', icon: Scale },
  ];

  const navItems = allNavItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return currentUser?.role && item.requiredRoles.includes(currentUser.role);
  });

  const getPageMeta = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return {
          title: 'Executive Pendency & Workflow Overview',
          subtitle: 'Live stage monitoring, queue bottlenecks, and statutory compliance indicators',
        };
      case '/applications':
        return {
          title: 'Master Applications Register',
          subtitle: 'Multi-parameter indexing, stage tracking, and cross-regional institution records',
        };
      case '/workflow-queue':
        return {
          title: 'Regulatory Scrutiny & Evaluation Queue',
          subtitle: 'Deficiency management, AICTE handbook checklist validation, and officer findings',
        };
      case '/evc':
        return {
          title: 'Expert Visit Committee (EVC) Operations',
          subtitle: 'Committee constitution, physical inspection records, and 48-hour upload SLAs',
        };
      case '/compliance':
        return {
          title: 'Institutional Compliance & Undertakings',
          subtitle: '90-day conditional approvals, land registry monitoring, and legal undertakings',
        };
      case '/document-validity':
        return {
          title: 'Document Expiry & Validity Radar',
          subtitle: 'Building occupancy NOCs, fire safety, FDRs, and registered lease surveillance',
        };
      case '/reports':
        return {
          title: 'Official Reports & Analytical Intelligence',
          subtitle: 'Council-level stage aging statistics, turnaround benchmarks, and regional summaries',
        };
      case '/audit':
        return {
          title: 'Forensic Regulatory Audit Trail',
          subtitle: 'Cryptographically ordered, immutable record of all administrative decisions and stage transitions',
        };
      case '/admin/rules':
        return {
          title: 'Configurable Regulatory Rules Register',
          subtitle: 'Handbook citations, SLA parameters, and statutory transition rules (APH 2024–27)',
        };
      default:
        return {
          title: 'Portal Console',
          subtitle: 'AICTE Approval Workflow Automation & Compliance Management System',
        };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#17202B] selection:bg-[#142B45] selection:text-white">
      {/* 1. Indian National Government Header Accent Ribbon */}
      <div className="gov-accent-stripe"></div>

      {/* 2. Official Government Accessibility & Sovereign Identity Bar */}
      <div className="bg-[#0A1B38] text-slate-300 text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#17202B]">
        <div className="w-full max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Flag & Government / Ministry Identity */}
          <div className="flex items-center space-x-3">
            <IndiaFlag width={22} height={14} />
            <div className="flex items-center space-x-2 font-medium">
              <span className="font-bold text-white tracking-wide">भारत सरकार</span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-200">Government of India</span>
              <span className="hidden md:inline text-slate-500">•</span>
              <span className="hidden md:inline text-slate-300">शिक्षा मंत्रालय (Ministry of Education)</span>
            </div>
            <span className="hidden lg:inline px-2 py-0.5 rounded-sm bg-[#142B45] text-[#E98232] border border-[#E98232] font-mono font-bold text-[10px] uppercase">
              SIH PS 26262 • Bit2Bramha
            </span>
          </div>

          {/* Right: Accessibility Controls & Language */}
          <div className="flex items-center space-x-3 text-slate-300">
            {/* Font Resizing Controls */}
            <div className="flex items-center space-x-1 border border-[#3E556E] rounded-sm px-1.5 py-0.5 bg-[#071224]">
              <button
                onClick={() => changeFontSize(-0.05)}
                className="hover:text-white px-1 font-bold text-[10px]"
                title={t('Decrease font size')}
              >
                A-
              </button>
              <button
                onClick={resetFontSize}
                className="hover:text-white px-1 font-bold text-[10px] text-[#E98232]"
                title={t('Reset font size')}
              >
                A
              </button>
              <button
                onClick={() => changeFontSize(0.05)}
                className="hover:text-white px-1 font-bold text-[11px]"
                title={t('Increase font size')}
              >
                A+
              </button>
            </div>

            {/* Language Switcher */}
            <LanguageSelector variant="dark" />

            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-300 font-mono text-[11px]">
              {t('Academic Cycle')}: <strong className="text-white">2026–2027</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Official Ministry & Council Header Banner */}
      <header className="bg-white border-b-2 border-[#17202B] py-3.5 px-4 sm:px-8">
        <div className="w-full max-w-[1720px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo & Council Branding */}
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <NavLink to="/dashboard" className="flex items-center space-x-3.5 group">
              <CouncilEmblem size={56} className="transition-transform group-hover:scale-[1.02]" />
              <div>
                <h2 className="text-[11px] font-bold text-[#8B1A10] uppercase tracking-wider">
                  अखिल भारतीय तकनीकी शिक्षा परिषद
                </h2>
                <h1 className="text-base sm:text-lg font-display font-bold text-[#142B45] tracking-tight leading-tight">
                  ALL INDIA COUNCIL FOR TECHNICAL EDUCATION
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="font-black text-xs text-[#142B45] tracking-wider uppercase bg-[#EAF0F5] px-1.5 py-0.2 border border-[#17202B]">
                    PRAVAH
                  </span>
                  <span className="text-[11px] text-[#5B6875] hidden sm:inline font-medium">
                    Approval Workflow Automation & Compliance Monitoring System
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-sm bg-[#FFF7ED] text-[#B45309] border border-[#B45309] font-bold uppercase font-mono">
                    SIH 26262
                  </span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* Quick Header Search Bar & Authorized Officer Profile */}
          <div className="flex items-center justify-between md:justify-end space-x-3 w-full md:w-auto">
            {/* Search Input with Command Palette trigger */}
            <div
              onClick={() => setCommandPaletteOpen(true)}
              className="relative w-full sm:w-80 cursor-pointer"
            >
              <input
                type="text"
                readOnly
                placeholder={t('Search or press Ctrl + K...')}
                className="w-full bg-[#FAF9F6] border-2 border-[#17202B] rounded-sm py-1.5 pl-8 pr-16 text-xs text-[#17202B] font-medium placeholder-[#5B6875] cursor-pointer hover:bg-white shadow-[2px_2px_0px_#17202B] focus:outline-none transition"
              />
              <Search className="w-3.5 h-3.5 text-[#5B6875] absolute left-2.5 top-2.5" />
              <kbd className="absolute right-2 top-1.5 text-[10px] font-mono font-bold text-[#17202B] bg-[#EAF0F5] border border-[#17202B] rounded-sm px-1.5 py-0.5 shadow-sm">
                Ctrl K
              </kbd>
            </div>

            {/* Notification Bell */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-sm border-2 border-[#17202B] text-[#17202B] bg-white hover:bg-[#EAF0F5] shadow-[2px_2px_0px_#17202B] relative transition"
                aria-label={t('View alerts')}
              >
                <Bell className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-none bg-[#C5221F] border border-white"></span>
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white text-[#17202B] rounded-sm shadow-[4px_4px_0px_#17202B] border-2 border-[#17202B] p-3 z-50">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-[#17202B] text-xs">
                    <span className="font-bold text-[#142B45] uppercase tracking-wider">{t('Operational Notices (3 Critical)')}</span>
                    <button
                      className="text-[11px] font-bold text-[#5B6875] hover:text-[#17202B] uppercase underline"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      {t('Dismiss')}
                    </button>
                  </div>
                  <div className="divide-y divide-[#CBD5E1] max-h-64 overflow-y-auto text-xs py-1">
                    <div className="py-2.5 space-y-1">
                      <p className="font-bold text-[#C5221F] flex items-center gap-1.5 uppercase text-[11px]">
                        <Clock className="w-3.5 h-3.5" /> EVC Report Overdue (+114h)
                      </p>
                      <p className="text-[11px] text-[#5B6875] leading-relaxed">
                        Ganga Valley College of Architecture inspection report overdue by 4.7 days.
                      </p>
                    </div>
                    <div className="py-2.5 space-y-1">
                      <p className="font-bold text-[#B45309] flex items-center gap-1.5 uppercase text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" /> Land Lease Expiry (52 Days)
                      </p>
                      <p className="text-[11px] text-[#5B6875] leading-relaxed">
                        Sahyadri College 30-year registered lease expiring in 52 days.
                      </p>
                    </div>
                    <div className="py-2.5 space-y-1">
                      <p className="font-bold text-[#C5221F] flex items-center gap-1.5 uppercase text-[11px]">
                        <ShieldAlert className="w-3.5 h-3.5" /> NBA Accreditation Lapsed
                      </p>
                      <p className="text-[11px] text-[#5B6875] leading-relaxed">
                        Kalinga Institute of Pharmacy intake increase blocked by expired accreditation.
                      </p>
                    </div>
                  </div>
                  <NavLink
                    to="/document-validity"
                    onClick={() => setNotificationsOpen(false)}
                    className="block text-center text-xs font-bold text-[#142B45] pt-2 border-t-2 border-[#17202B] hover:text-[#E98232] uppercase tracking-wide"
                  >
                    {t('View All Priority Alerts →')}
                  </NavLink>
                </div>
              )}
            </div>

            {/* Officer Profile Dropdown */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center space-x-2 text-left p-1.5 rounded-sm border-2 border-[#17202B] bg-white hover:bg-[#FAF9F6] shadow-[2px_2px_0px_#17202B] transition text-xs"
              >
                <div className="w-7 h-7 rounded-sm bg-[#142B45] text-white border border-[#17202B] flex items-center justify-center font-bold text-xs">
                  {currentUser?.name?.charAt(0) || 'O'}
                </div>
                <div className="hidden lg:block">
                  <p className="font-bold text-[#17202B] leading-tight text-xs">{currentUser?.name || 'Officer'}</p>
                  <p className="text-[10px] text-[#B45309] font-bold uppercase truncate max-w-[130px]">
                    {currentUser?.role ? currentUser.role.replace(/_/g, ' ') : 'OFFICER'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#17202B]" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-[#17202B] rounded-sm shadow-[4px_4px_0px_#17202B] border-2 border-[#17202B] py-2 z-50">
                  <div className="px-4 py-2 border-b-2 border-[#17202B] text-xs">
                    <p className="text-[#5B6875] font-bold uppercase text-[10px] tracking-wider">{t('Authenticated Officer:')}</p>
                    <p className="font-black text-[#142B45] text-sm mt-0.5">{currentUser?.name || 'Officer'}</p>
                    <p className="text-[11px] text-[#5B6875]">{currentUser?.designation || 'Technical Scrutiny Officer'}</p>
                    <p className="text-[10px] text-[#142B45] font-bold mt-1 uppercase font-mono">
                      Scope: {currentUser?.region || 'National Scope'}
                    </p>
                  </div>

                  {/* Development Persona Simulator */}
                  {import.meta.env.DEV && (
                    <div className="px-3 py-2 text-xs border-b border-[#CBD5E1] bg-[#FFF7ED]">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#B45309] uppercase tracking-wider">
                          {t('Role Persona Switcher')}
                        </span>
                        <span className="text-[9px] bg-[#E98232] text-white px-1 rounded-sm font-bold">DEV</span>
                      </div>
                      <p className="text-[10px] text-[#5B6875] mb-1.5 leading-tight">
                        {t('Switches session via backend Argon2id & sets HttpOnly cookie session.')}
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {Object.entries(PRESET_USERS).map(([roleKey, profile]) => (
                          <button
                            key={roleKey}
                            onClick={async () => {
                              try {
                                await switchRole(roleKey as UserRole);
                              } catch {
                                // Handled in AuthContext
                              }
                              setUserDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 rounded-sm text-xs flex items-center justify-between border ${
                              currentUser?.role === roleKey
                                ? 'bg-[#142B45] text-white font-bold border-[#0A1B38]'
                                : 'bg-white hover:bg-[#EAF0F5] text-[#17202B] border-[#CBD5E1]'
                            }`}
                          >
                            <span className="truncate">{profile.name}</span>
                            <span className="text-[10px] opacity-75 font-mono uppercase">
                              {roleKey.split('_')[0]}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 px-2">
                    <button
                      onClick={async () => {
                        await logout();
                        setUserDropdownOpen(false);
                        navigate('/login');
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-sm text-xs text-[#C5221F] bg-[#FDF2F2] border border-[#C5221F] hover:bg-[#FEE2E2] flex items-center space-x-2 font-bold uppercase tracking-wider"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Officer Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 4. Official "LATEST UPDATES / त्वरित सूचनाएं" Marquee Ticker Bar */}
      <div className="bg-[#FFF7ED] border-y-2 border-[#17202B] py-2 px-4 sm:px-8 flex items-center overflow-hidden">
        <div className="w-full max-w-[1720px] mx-auto flex items-center">
          {/* Badge */}
          <div className="flex items-center space-x-2 bg-[#E98232] text-white px-3 py-1 rounded-sm border border-[#17202B] text-xs font-black uppercase tracking-wider flex-shrink-0 shadow-[1px_1px_0px_#17202B]">
            <span className="w-2 h-2 rounded-none bg-white animate-pulse"></span>
            <span>Latest Updates</span>
          </div>

          {/* Scrolling Ticker Text */}
          <div className="flex-1 overflow-hidden ml-3 relative">
            <div
              className={`ticker-track text-xs text-[#17202B] font-medium ${
                tickerPaused ? '[animation-play-state:paused]' : ''
              }`}
            >
              <span className="mx-4">
                • <strong>AICTE Approval Process 2026–2027</strong>: Scrutiny desk processing active in accordance with APH 2024–25 to 2026–27 regulations.
              </span>
              <span className="mx-4">
                • <strong>SLA Mandate</strong>: Strict 7-day turnaround for Scrutiny and Re-Scrutiny verification per AICTE Act norms.
              </span>
              <span className="mx-4">
                • <strong>EVC Inspection 48h Rule</strong>: Expert Visit Committee conveners must submit signed geo-tagged observation reports within 48 hours.
              </span>
              <span className="mx-4">
                • <strong>Land Lease Validity</strong>: Institutions holding &lt;30 years registered lease must furnish renewal registration to avoid intake sanction freeze.
              </span>
              <span className="mx-4">
                • <strong>Time-Bound Undertakings</strong>: 90-day conditional approvals approaching grace deadline flagged for automatic show-cause notice.
              </span>
              {/* Duplicate for infinite loop */}
              <span className="mx-4">
                • <strong>AICTE Approval Process 2026–2027</strong>: Scrutiny desk processing active in accordance with APH 2024–25 to 2026–27 regulations.
              </span>
              <span className="mx-4">
                • <strong>SLA Mandate</strong>: Strict 7-day turnaround for Scrutiny and Re-Scrutiny verification per AICTE Act norms.
              </span>
            </div>
          </div>

          {/* Pause / Play Button */}
          <button
            onClick={() => setTickerPaused(!tickerPaused)}
            className="p-1 rounded-sm text-[#17202B] border border-[#17202B] bg-white hover:bg-[#EAF0F5] ml-2 flex-shrink-0 shadow-[1px_1px_0px_#17202B]"
            title={tickerPaused ? 'Play Ticker' : 'Pause Ticker'}
            aria-label="Toggle ticker animation"
          >
            {tickerPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 5. Primary Full-Width Government Navigation Bar */}
      <nav
        aria-label="Main Navigation Bar"
        className="bg-[#142B45] text-white border-b-2 border-[#E98232] sticky top-0 z-30 shadow-[0_2px_0px_#17202B]"
      >
        <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-8 flex items-center justify-between">
          {/* Desktop Horizontal Navigation Items */}
          <div className="hidden lg:flex items-center space-x-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold transition-all border ${
                      isActive
                        ? 'bg-[#0A1B38] text-[#E98232] border-[#E98232] shadow-[1px_1px_0px_#071224]'
                        : 'border-transparent text-slate-200 hover:bg-[#0A1B38] hover:text-white hover:border-[#3E556E]'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{t(item.label)}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded-sm text-[10px] bg-[#E98232] text-white font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-2 h-2 rounded-none bg-[#C5221F] flex-shrink-0 animate-pulse"></span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Mobile Navigation Trigger */}
          <div className="flex items-center justify-between w-full lg:w-auto py-2.5 lg:py-0">
            <span className="text-xs font-bold text-[#E98232] uppercase tracking-wider lg:hidden">
              {t('Menu Navigation')}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-sm border border-[#3E556E] text-slate-200 hover:text-white hover:bg-[#0A1B38]"
              aria-label={t('Menu Navigation')}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Right Status Indicator */}
          <div className="hidden xl:flex items-center space-x-3 text-xs text-slate-300 py-1">
            <span className="flex items-center gap-1.5 font-mono text-[11px] bg-[#0A1B38] px-2 py-0.5 rounded-sm border border-[#3E556E]">
              <span className="w-2 h-2 rounded-none bg-[#18794E]"></span>
              <span className="text-slate-200 font-semibold">{t('Scrutiny Engine Active')}</span>
            </span>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0A1B38] border-t-2 border-[#17202B] px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-sm text-xs font-bold border ${
                      isActive
                        ? 'bg-[#142B45] text-[#E98232] border-[#E98232]'
                        : 'border-transparent text-slate-200 hover:bg-[#142B45]'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{t(item.label)}</span>
                  </div>
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-sm text-[10px] bg-[#E98232] text-white font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </nav>

      {/* 6. Main Content Area */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs & Page Metadata Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b-2 border-[#17202B] pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#5B6875] mb-1 font-mono">
              <NavLink to="/dashboard" className="hover:text-[#142B45] font-bold uppercase">
                मुख्य पृष्ठ (Home)
              </NavLink>
              <span>/</span>
              <span className="text-[#17202B] font-bold uppercase">
                {location.pathname.replace('/', '').replace('-', ' ') || 'Dashboard'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-[#142B45] tracking-tight">
              {t(meta.title)}
            </h1>
            <p className="text-xs text-[#5B6875] mt-0.5 font-medium">{t(meta.subtitle)}</p>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xs font-bold text-[#142B45] px-3 py-1 bg-white border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] rounded-sm font-mono">
              JURISDICTION: <strong>{currentUser?.region || 'NATIONAL'}</strong>
            </span>
          </div>
        </div>

        {/* Nested Page Component View */}
        <Outlet />
      </main>

      {/* 7. Official Indian Government Portal Footer */}
      <footer className="bg-[#0A1B38] text-white border-t-4 border-[#E98232] mt-16 pt-8 pb-6 px-4 sm:px-8 text-xs">
        <div className="w-full max-w-[1720px] mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-6 border-b border-[#1E3A5F]">
            {/* Col 1: Identity */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <CouncilEmblem size={44} />
                <div>
                  <p className="font-black text-sm text-white">PRAVAH PLATFORM</p>
                  <p className="text-[11px] text-[#E98232] font-semibold">All India Council for Technical Education</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System. Developed for Smart India Hackathon Problem Statement 26262 by Team Bit2Bramha.
              </p>
            </div>

            {/* Col 2: Official Portals */}
            <div className="space-y-2">
              <p className="font-bold text-[#E98232] text-xs uppercase tracking-wider">Related National Portals</p>
              <ul className="space-y-1 text-[11px] text-slate-300">
                <li><a href="https://www.aicte.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#E98232] font-medium">AICTE Official Portal &rarr;</a></li>
                <li><a href="https://www.education.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#E98232] font-medium">Ministry of Education, GoI &rarr;</a></li>
                <li><a href="https://www.nbaind.org" target="_blank" rel="noreferrer" className="hover:text-[#E98232] font-medium">National Board of Accreditation (NBA) &rarr;</a></li>
                <li><a href="https://sih.gov.in" target="_blank" rel="noreferrer" className="hover:text-[#E98232] font-medium">Smart India Hackathon (SIH 2026) &rarr;</a></li>
              </ul>
            </div>

            {/* Col 3: Regulatory Compliance */}
            <div className="space-y-2">
              <p className="font-bold text-[#E98232] text-xs uppercase tracking-wider">Statutory Directives</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Regulated under the All India Council for Technical Education Act 1987 (Act 52 of 1987) and Approval Process Handbook (APH 2024–25 to 2026–27). Decision support for statutory regional committees.
              </p>
            </div>

            {/* Col 4: Prototype Disclaimer */}
            <div className="space-y-2">
              <p className="font-bold text-[#E98232] text-xs uppercase tracking-wider">Security & Compliance</p>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Prototype demonstration backed by deterministic synthetic dataset. Autonomous regulatory approval prohibited. All administrative actions cryptographically logged.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <p>© 2026 All India Council for Technical Education (AICTE). SIH PS 26262 • Bit2Bramha.</p>
            <p>Designed per Guidelines for Indian Government Websites (GIGW) | Best viewed in modern browsers.</p>
          </div>
        </div>
      </footer>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
};
