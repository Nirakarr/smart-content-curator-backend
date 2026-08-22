import { Router } from "express";
import {
  createItemSchema,
  itemIdSchema,
  queryItemsSchema,
  validate,
} from "../schemas/saved-item.schema";
import {
  createItem,
  deleteItem,
  getItem,
  getItems,
} from "../controllers/saved-item.controller";

const router = Router();

router.post("/", validate(createItemSchema), createItem);
router.get("/", validate(queryItemsSchema), getItems);
router.get("/:id", validate(itemIdSchema), getItem);
router.delete("/:id", validate(itemIdSchema), deleteItem);

export default router;
