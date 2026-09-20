const VALID_ROLES = ["admin", "ict_officer", "viewer"];

function isAdminRole(role) {
  return role === "admin";
}

function canManageSystem(role) {
  return role === "admin" || role === "ict_officer";
}

function canInjectFailures(role) {
  return role === "admin" || role === "ict_officer";
}

function canViewOnly(role) {
  return role === "viewer";
}

module.exports = {
  VALID_ROLES,
  isAdminRole,
  canManageSystem,
  canInjectFailures,
  canViewOnly,
};
