import { Router } from "express";
import * as expenseController from "../controllers/expenseController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post("/expenses", authMiddleware(), expenseController.createExpense);

export const expenseRouter = router;