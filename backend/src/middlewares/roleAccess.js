import { VALID_ROLES, isAdminRole, canManageSystem, canInjectFailures } from "../utils/roleHelpers.js";

export { VALID_ROLES };

export const ROLE_ACCESS = {
  FULL_ACCESS: ["admin"],
  MANAGE: ["admin", "ict_officer"],
  INJECT: ["admin", "ict_officer"],
};

export const hasFullAccess = (userRole) => ROLE_ACCESS.FULL_ACCESS.includes(userRole);

export const requireAdmin = async (req, res, next) => {
  if (!req.user || !isAdminRole(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Only the Administrator can do this.",
    });
  }
  return next();
};

export const requireManageAccess = async (req, res, next) => {
  if (!req.user || !canManageSystem(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "You can view this, but only Admin or ICT Officer can change it.",
    });
  }
  return next();
};

export const requireInjectAccess = async (req, res, next) => {
  if (!req.user || !canInjectFailures(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Only Admin or ICT Officer can run test failures.",
    });
  }
  return next();
};

export const checkRoleModificationAccess = (req, res, next) => {
  if (!req.user || !hasFullAccess(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Only the Administrator can add or change users.",
    });
  }
  return next();
};
