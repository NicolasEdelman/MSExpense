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
    const authHeader = req.headers.authorization;
    const companyId = req.headers['x-company-id'] as string;
    const userRole = req.headers['x-user-role'] as string;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!companyId) {
      res.status(400).json({ error: "x-company-id header is required" });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      // Por ahora, vamos a simular la verificación del token
      // y usar el companyId del header
      const decoded = {
        userId: "temp-user-id", // Esto debería venir del token JWT
      };

      req.user = {
        userId: decoded.userId,
        companyId: companyId,
        role: userRole,
      };

      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};
