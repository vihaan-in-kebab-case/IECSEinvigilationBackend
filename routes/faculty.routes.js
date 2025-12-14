import express from "express";
import { requireAuth } from "../middlewares/requireAuthAzure.js";
import {
  getFacultyInfo,
  assignSlot,
  unassignSlot
} from "../controllers/faculty.controller.js";

const router = express.Router();

router.get("/me", requireAuth, getFacultyInfo);
router.post("/assign/:slotId", requireAuth, assignSlot);
router.put("/unassign/:slotId", requireAuth, unassignSlot);

export default router;