import type { RequestHandler } from "express";
import type { UserRole } from "../types";

export const authorize = (...allowedRoles: UserRole[]): RequestHandler => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Forbidden: Insufficient Permissions" });
      return;
    }
    next();
  };
};
