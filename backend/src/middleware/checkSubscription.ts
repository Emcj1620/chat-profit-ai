import { Request, Response, NextFunction } from "express";
import Tenant from "../models/Tenant";
import AppError from "../errors/AppError";

const checkSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { tenantId } = req.user;

  if (!tenantId) {
    throw new AppError("ERR_NO_TENANT_FOUND", 400);
  }

  const tenant = await Tenant.findByPk(tenantId);

  if (!tenant) {
    throw new AppError("ERR_NO_TENANT_FOUND", 404);
  }

  // Tenant 1 is the SaaS administrator / master tenant, always active
  if (tenantId === 1) {
    return next();
  }

  const now = new Date();
  const dueDate = new Date(tenant.dueDate);

  if (tenant.subscriptionStatus === "suspended" || dueDate < now) {
    throw new AppError("ERR_ACCOUNT_SUSPENDED", 403);
  }

  return next();
};

export default checkSubscription;
