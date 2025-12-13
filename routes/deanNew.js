import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireDean } from "../middlewares/requireDean.js";
import {
  createExamSlot,
  getExamSlots
} from "../controllers/dean.controller.js";

const router = express.Router();

router.post("/exam-slots", requireAuth, requireDean, createExamSlot);
router.get("/exam-slots", requireAuth, requireDean, getExamSlots);

export default router;