export const VALID_ROLES = ['admin', 'ict_officer', 'viewer'];

export function canManageOrg(role) {
  return role === 'admin' || role === 'ict_officer';
}

export function canInject(role) {
  return role === 'admin' || role === 'ict_officer';
}

export function isAdmin(role) {
  return role === 'admin';
}

export function isViewer(role) {
  return role === 'viewer';
}

export function roleLabel(role) {
  const map = {
    admin: 'Administrator',
    ict_officer: 'ICT Officer',
    viewer: 'Viewer (read only)',
  };
  return map[role] || role || '—';
}

export function rolePlainHelp(role) {
  const map = {
    admin: 'Can manage users, settings, and run all tests.',
    ict_officer: 'Can run tests and recover services, but cannot manage users.',
    viewer: 'Can only watch dashboards and charts — safe for demos.',
  };
  return map[role] || '';
}

export function statusTone(status) {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'degraded':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'failed':
    case 'recovering':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'failed_over':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'standby':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}
