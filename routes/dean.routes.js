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

router.post("/onboard", onboardFaculty);
router.post("/create-exam-dates", createExamDates);
router.post("/create-classrooms", createClassroom);
router.post("/create-exam-slots", createExamSlot);

router.delete("/delete-exam-date/:dateId", deleteExamDate);
router.delete("/delete-classroom/:classroomId", deleteClassroom);
router.delete("/delete-exam-slot/:slotId", deleteSlot);

router.get("/list-exam-dates", listExamDates);
router.get("/list-classrooms", listClassrooms);
router.get("/list-schedule", getSchedule);
router.get("/pdf-schedule", exportSchedulePdf);

export default router;