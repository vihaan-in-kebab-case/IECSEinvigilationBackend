import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireDean } from "../middlewares/requireDean.js";
import { exportSchedulePdf } from "../controllers/dean.controller.js";
import {
  createExamDate,
  deleteExamDate,
  getSchedule
} from "../controllers/dean.controller.js";

const router = express.Router();

router.use(requireAuth, requireDean);

router.post("/exam-dates", createExamDate);
router.delete("/exam-dates/:id", deleteExamDate);
router.get("/schedule", getSchedule);
router.get("/schedule/pdf", exportSchedulePdf);

export default router;