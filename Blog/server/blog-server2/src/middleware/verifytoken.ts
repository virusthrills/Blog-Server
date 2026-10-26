import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import type { AuthTokenPayload } from "../types";

export const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "Access Denied: No Token Provided" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ message: "JWT secret is not defined" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (
      typeof decoded === "string" ||
      typeof decoded.id !== "string" ||
      typeof decoded.email !== "string" ||
      typeof decoded.firstName !== "string" ||
      !["user", "admin", "manager"].includes(decoded.role)
    ) {
      res.status(401).json({ message: "Invalid Token" });
      return;
    }
    req.user = decoded as AuthTokenPayload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid Token" });
  }
};
