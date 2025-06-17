import { Router } from "express";
import * as expenseController from "../controllers/categoryController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post(
    "/expense-categories",
    authMiddleware(),
    expenseController.createCategory
  );

router.put("/expense-categories/:categoryId",
    authMiddleware(),
    expenseController.updateCategory
)

export const expenseRouter = router;