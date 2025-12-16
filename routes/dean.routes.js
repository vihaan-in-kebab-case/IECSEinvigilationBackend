import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireDean } from "../middlewares/requireDean.js";
import {
  createExamDates,
  deleteExamDate,
  getSchedule,
  exportSchedulePdf,
  createExamSlot,
  deleteSlot,
  createClassroom,
  deleteClassroom,
  onboardFaculty,
  listClassrooms,
  listExamDates
} from "../controllers/dean.controller.js";

const router = express.Router();
router.use(requireAuth, requireDean);

router.post("/faculty", onboardFaculty);
router.post("/exam-dates", createExamDates);
router.post("/classrooms", createClassroom);
router.post("/exam-slots", createExamSlot);

router.delete("/exam-dates/:dateId", deleteExamDate);
router.delete("/classrooms/:classroomId", deleteClassroom);
router.delete("/exam-slots/:slotId", deleteSlot);

router.get("/exam-dates", listExamDates);
router.get("/classrooms", listClassrooms);
router.get("/schedule", getSchedule);
router.get("/schedule/pdf", exportSchedulePdf);

export default router;