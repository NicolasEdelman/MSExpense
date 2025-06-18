import { Router } from "express";
import * as expenseController from "../controllers/expenseController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/expenses", authMiddleware(), expenseController.createExpense);
router.delete("/expenses/:expenseId", authMiddleware(), expenseController.softDeleteExpense);

export const expenseRouter = router;