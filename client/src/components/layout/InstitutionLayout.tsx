import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { GeometricMark } from '../common/GeometricMark';
import { IndiaFlag } from '../common/GovtEmblem';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { getInstitutionNotifications, markNotificationAsRead } from '../../services/institutionService';
import { Notification } from '@saksham/shared';
import {
  Building2,
  FileText,
  ShieldCheck,
  User,
  Plus,
  Bell,
  LogOut,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';

export const InstitutionLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const items = await getInstitutionNotifications();
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
    } catch {
      // Fail silently for background notification poll
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (notif.link) {
      setNotificationsOpen(false);
      navigate(notif.link);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/institution/dashboard', icon: Building2 },
    { name: 'Applications', path: '/institution/applications', icon: FileText },
    { name: 'Documents', path: '/institution/documents', icon: FileText },
    { name: 'Compliance', path: '/institution/compliance', icon: ShieldCheck },
    { name: 'Profile', path: '/institution/profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col text-[#17202B] selection:bg-[#142B45] selection:text-white">
      {/* 1. Indian National Government Accent Ribbon */}
      <div className="gov-accent-stripe"></div>

      {/* 2. Top AICTE Statutory Sovereign Bar */}
      <div className="bg-[#0A1B38] text-white text-[11px] py-1.5 px-4 sm:px-8 border-b border-[#17202B] flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <IndiaFlag width={20} height={13} />
          <span className="font-bold tracking-wide">
            {t('AICTE National Approval Portal • Institutional Workspace')}
          </span>
          <span className="hidden md:inline text-slate-500">|</span>
          <span className="hidden md:inline text-slate-300">SIH PS 26262 • Bit2Bramha</span>
        </div>
        <div className="flex items-center space-x-3 text-slate-300">
          <span className="hidden sm:inline font-mono">{t('Academic Year: 2026–27')}</span>
          <span className="bg-[#142B45] px-2 py-0.5 rounded-sm text-[10px] text-[#E98232] border border-[#E98232] font-mono font-bold">
            PID: {currentUser?.permanentInstituteId || 'PENDING'}
          </span>
        </div>
      </div>

      {/* 3. Main Header */}
      <header className="bg-white border-b-2 border-[#17202B] sticky top-0 z-30 shadow-[0_2px_0px_#17202B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Brand & Institution Info */}
            <div className="flex items-center space-x-3">
              <Link to="/institution/dashboard" className="flex items-center space-x-3 group">
                <GeometricMark size={36} />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-black text-[#142B45] tracking-tight">PRAVAH</span>
                    <span className="text-[10px] bg-[#FFF7ED] text-[#B45309] border border-[#B45309] px-1.5 py-0.2 rounded-sm font-black uppercase font-mono">
                      INSTITUTION DESK
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-[#5B6875] truncate max-w-[200px] sm:max-w-xs">
                    {currentUser?.institutionName || 'Institutional Representative Portal'}
                  </p>
                </div>
              </Link>
            </div>

            {/* Middle: Desktop Navigation */}
            <nav className="hidden md:flex space-x-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-1.5 px-3 py-1.5 rounded-sm text-xs font-bold transition border ${
                        isActive
                          ? 'bg-[#142B45] text-white border-[#0A1B38] shadow-[2px_2px_0px_#17202B]'
                          : 'bg-white text-[#17202B] border-transparent hover:border-[#17202B] hover:bg-[#FAF9F6]'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t(item.name)}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Actions, Notifications & Sign Out */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              <LanguageSelector variant="light" />

              <Link
                to="/institution/applications/new"
                className="hidden sm:inline-flex items-center space-x-1.5 py-1.5 px-3 rounded-sm bg-[#E98232] text-white text-xs font-black uppercase tracking-wider border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] hover:bg-[#D16E20] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[3px_3px_0px_#17202B] active:translate-x-[1px] active:translate-y-[1px] transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('New Application')}</span>
              </Link>

              {/* Notification Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="p-1.5 rounded-sm border-2 border-[#17202B] bg-white text-[#17202B] hover:bg-[#EAF0F5] shadow-[2px_2px_0px_#17202B] relative focus:outline-none"
                  aria-label={t('Notifications & Deficiencies')}
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C5221F] text-white border border-white text-[9px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-[#17202B] rounded-sm shadow-[4px_4px_0px_#17202B] border-2 border-[#17202B] py-2 z-50">
                    <div className="px-4 py-2 border-b-2 border-[#17202B] flex items-center justify-between">
                      <span className="text-xs font-black text-[#142B45] uppercase tracking-wider">{t('Notices & Deficiencies')}</span>
                      <span className="text-[10px] font-bold text-[#B45309] font-mono">{unreadCount} {t('unread')}</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-[#CBD5E1]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#5B6875] font-medium">
                          {t('No notifications at this time.')}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`p-3 text-left hover:bg-[#FAF9F6] cursor-pointer transition ${
                              !n.isRead ? 'bg-[#FFF7ED]' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-2">
                              {n.type === 'WARNING' ? (
                                <AlertTriangle className="w-4 h-4 text-[#B45309] flex-shrink-0 mt-0.5" />
                              ) : n.type === 'SUCCESS' ? (
                                <CheckCircle2 className="w-4 h-4 text-[#18794E] flex-shrink-0 mt-0.5" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-[#142B45] flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <p className="text-xs font-bold text-[#17202B]">{n.title}</p>
                                <p className="text-[11px] text-[#5B6875] mt-0.5 leading-relaxed">{n.message}</p>
                                <span className="text-[10px] text-[#5B6875] mt-1 block font-mono">
                                  {new Date(n.createdAt).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown / Sign Out */}
              <div className="border-l-2 border-[#CBD5E1] pl-2 sm:pl-3 flex items-center space-x-2">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-black text-[#142B45] leading-tight">
                    {currentUser?.fullName}
                  </div>
                  <div className="text-[10px] text-[#5B6875] font-mono">
                    {currentUser?.email}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  title={t('Sign out')}
                  className="p-1.5 text-[#C5221F] bg-[#FDF2F2] border border-[#C5221F] hover:bg-[#FEE2E2] rounded-sm transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 text-[#17202B] border-2 border-[#17202B] bg-white rounded-sm shadow-[1px_1px_0px_#17202B]"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t-2 border-[#17202B] bg-white px-4 pt-2 pb-4 space-y-1.5">
            <div className="p-2.5 bg-[#FAF9F6] border border-[#17202B] rounded-sm mb-2">
              <div className="text-xs font-black text-[#142B45]">{currentUser?.institutionName}</div>
              <div className="text-[11px] text-[#5B6875] font-mono font-bold">PID: {currentUser?.permanentInstituteId}</div>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center space-x-2 px-3 py-2 rounded-sm text-xs font-bold border ${
                      isActive ? 'bg-[#142B45] text-white border-[#0A1B38]' : 'text-[#17202B] border-transparent hover:bg-[#FAF9F6]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(item.name)}</span>
                </NavLink>
              );
            })}
            <Link
              to="/institution/applications/new"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center space-x-2 px-3 py-2 rounded-sm text-xs font-black uppercase tracking-wider bg-[#E98232] text-white border-2 border-[#17202B] shadow-[2px_2px_0px_#17202B] mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>{t('New Application')}</span>
            </Link>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Government Footer */}
      <footer className="bg-[#0A1B38] text-white border-t-4 border-[#E98232] py-6 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            <strong className="text-white font-black">PRAVAH AICTE PORTAL</strong> • Approval Process Handbook (APH 2024–27 Compliance Subsystem)
          </div>
          <div className="text-[11px] text-slate-300 font-mono">
            SIH PS 26262 • Team Bit2Bramha
          </div>
        </div>
      </footer>
    </div>
  );
};
