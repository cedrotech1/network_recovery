import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Settings,
  Users,
  LogOut,
  ScrollText,
  FileText,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UokLogo } from './UokLogo';
import { appPath, loginPath } from '../utils/appPaths';
import { isAdmin, canManageOrg, roleLabel } from '../utils/roles';

const SidebarItem = ({ icon, label, active = false, collapsed = false, onClick }) => (
  <button
    type="button"
    className={`
      w-full flex items-center transition-colors duration-200 rounded-lg px-4 py-3 text-left
      ${collapsed ? 'lg:justify-center lg:px-2' : ''}
      ${active ? 'bg-[#00628b] text-white' : 'text-gray-700 hover:bg-gray-100'}
    `}
    onClick={onClick}
    title={collapsed ? label : undefined}
  >
    <span className={`w-5 h-5 shrink-0 mr-3 ${collapsed ? 'lg:mr-0' : ''}`}>{icon}</span>
    <span className={`font-medium text-sm leading-snug ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
  </button>
);

export const Sidebar = ({ collapsed = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  // Guide + experiments stay reachable by URL (/guide, /experiments) but are not in the menu
  const items = [
    { id: 'dashboard', label: 'Home overview', icon: <LayoutDashboard size={20} />, path: appPath('dashboard') },
    { id: 'nodes', label: 'Our services', icon: <Server size={20} />, path: appPath('nodes') },
    { id: 'logs', label: 'Activity logs', icon: <ScrollText size={20} />, path: appPath('logs') },
    { id: 'failures', label: 'Problems found', icon: <AlertTriangle size={20} />, path: appPath('failures') },
    { id: 'recoveries', label: 'Fixes done', icon: <RefreshCw size={20} />, path: appPath('recoveries') },
    { id: 'metrics', label: 'Charts & statistics', icon: <BarChart3 size={20} />, path: appPath('metrics') },
  ];

  if (canManageOrg(user?.role)) {
    items.push({ id: 'settings', label: 'Settings', icon: <Settings size={20} />, path: appPath('settings') });
  }

  if (isAdmin(user?.role)) {
    items.push({
      id: 'report',
      label: 'General report',
      icon: <FileText size={20} />,
      path: appPath('report'),
    });
    items.push({ id: 'users', label: 'People & roles', icon: <Users size={20} />, path: appPath('users') });
  }

  const handleLogout = () => {
    logout();
    navigate(loginPath());
  };

  const isActive = (item) => {
    const path = location.pathname;
    return path === item.path || path.startsWith(`${item.path}/`);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className={`flex items-center gap-3 border-b border-gray-100 px-4 py-4 ${collapsed ? 'lg:justify-center' : ''}`}>
        <div className="h-10 w-10 shrink-0">
          <UokLogo />
        </div>
        <div className={collapsed ? 'lg:hidden' : ''}>
          <p className="m-0 text-sm font-bold text-[#1e3c72] leading-tight">AFDRS</p>
          <p className="m-0 text-[11px] text-gray-500">{roleLabel(user?.role)}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {items.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
            active={isActive(item)}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      <div className="p-3 border-t border-gray-100">
        <SidebarItem
          icon={<LogOut size={20} />}
          label="Sign out"
          collapsed={collapsed}
          onClick={handleLogout}
        />
      </div>
    </div>
  );
};
