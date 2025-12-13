import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireFaculty } from "../middlewares/requireFaculty.js";
import {
  assignSlot,
  unassignSlot,
  getMyAssignments
} from "../controllers/faculty.controller.js";

const router = express.Router();

router.use(requireAuth, requireFaculty);

router.get("/my-slots", getMyAssignments);
router.post("/assign/:slotId", assignSlot);
router.delete("/unassign/:slotId", unassignSlot);

export default router;