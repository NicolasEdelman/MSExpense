import type { NextFunction, Request, Response } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    companyId: string;
    role?: string;
  };
}

export const authMiddleware = () => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const companyId = req.headers["x-company-id"] as string;
    const userRole = req.headers["x-user-role"] as string;
    const userId = req.headers["x-user-id"] as string;

    if (!companyId) {
      res.status(400).json({ error: "x-company-id header is required" });
      return;
    }
    if (!userId) {
      res.status(400).json({ error: "x-user-id header is required" });
      return;
    }
    if (!userRole) {
      res.status(400).json({ error: "x-user-role header is required" });
      return;
    }
    req.user = {
      userId: userId,
      companyId: companyId,
      role: userRole,
    };
    next();
  };
};
