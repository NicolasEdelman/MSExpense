import { Router } from "express";
import * as categoryController from "../controllers/categoryController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

router.post(
    "/expense-categories",
    authMiddleware(),
    categoryController.createCategory
  );

router.put("/expense-categories/:categoryId",
    authMiddleware(),
    categoryController.updateCategory
)
router.delete(
  "/expense-categories/:categoryId",
  authMiddleware(),
  categoryController.softDeleteCategory
);

router.get(
  "/expense-categories",
  authMiddleware(),
  categoryController.getCategories
);  

export const categoryRouter = router;