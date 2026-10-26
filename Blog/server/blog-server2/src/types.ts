import type { JwtPayload } from "jsonwebtoken";

export type UserRole = "user" | "admin" | "manager";

export interface AuthTokenPayload extends JwtPayload {
  id: string;
  email: string;
  firstName: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
