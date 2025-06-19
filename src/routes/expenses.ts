import { Router } from "express";
import * as expenseController from "../controllers/expenseController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/expenses", authMiddleware(), expenseController.createExpense);
router.delete("/expenses/:expenseId", authMiddleware(), expenseController.softDeleteExpense);
router.put("/expenses/:expenseId", authMiddleware(), expenseController.updateExpense);
router.get("/expenses", authMiddleware(), expenseController.getExpenses);
router.get("/expenses/top-categories", authMiddleware(), expenseController.getTopExpenseCategories);
router.get(  "/expenses/:categoryId", authMiddleware(), expenseController.getExpensesByCategoryAndDateRange);

export const expenseRouter = router;