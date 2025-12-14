import express from "express";
import { requireAuth } from "../middlewares/requireAuthAzure.js";
import { requireDean } from "../middlewares/requireDean.js";
import {
  createExamDate,
  deleteExamDate,
  exportSchedulePdf
} from "../controllers/dean.controller.js";

const router = express.Router();

router.use(requireAuth, requireDean);

router.post("/exam-dates", createExamDate);
router.delete("/exam-dates/:id", deleteExamDate);
router.get("/schedule/pdf", exportSchedulePdf);

export default router;