import express from "express";
import { supabase } from "../utils/supabaseClient.js";
import { authenticate, authorize } from "../utils/authMiddleware.js";

const router = express.Router();

router.get("/available-slots", authenticate, authorize("faculty"), async (req, res) => {
  const { data, error } = await supabase
    .from("exam_schedule")
    .select(`
      id, exam_day:exam_days(date),
      slot:time_slots(start_time, end_time),
      classroom:classrooms(room_number)
    `)
    .eq("status", "available");

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

router.post("/book-slot/:id", authenticate, authorize("faculty"), async (req, res) => {
  const { id } = req.params;
  const facultyId = req.user.id;

  const { error } = await supabase
    .from("exam_schedule")
    .update({ assigned_faculty: facultyId, status: "booked" })
    .eq("id", id)
    .eq("status", "available");

  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: "Slot booked successfully" });
});

export default router;