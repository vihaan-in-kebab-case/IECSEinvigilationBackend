import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireFaculty } from "../middlewares/requireFaculty.js";
import {
  getFacultyInfo,
  assignSlot,
  unassignSlot,
  listSlots
} from "../controllers/faculty.controller.js";

const router = express.Router();
router.use(requireAuth);

router.get("/slots", listSlots);
router.get("/me", getFacultyInfo);

router.post("/assign/:slotId", assignSlot);
router.put("/unassign/:slotId", unassignSlot);

export default router;