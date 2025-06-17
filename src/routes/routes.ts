import { Router } from "express";
import * as expenseController from "../controllers/controller";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post(
    "/expense-categories",
    authMiddleware(),
    expenseController.createCategory
  );

export const expenseRouter = router;