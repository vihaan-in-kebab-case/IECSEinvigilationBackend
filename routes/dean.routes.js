import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireDean } from "../middlewares/requireDean.js";
import {
  createExamDate,
  deleteExamDate,
  exportSchedulePdf,
  generateSlots,
  deleteSlot
} from "../controllers/dean.controller.js";

const router = express.Router();
router.use(requireAuth, requireDean);

router.post("/exam-dates", createExamDate);
router.post("/exam-dates/:id/generate-slots", generateSlots);
router.delete("/exam-dates/:id", deleteExamDate);
router.delete("/exam-dates/:id/delete-slot", deleteSlot);
router.get("/schedule/pdf", exportSchedulePdf);

export default router;