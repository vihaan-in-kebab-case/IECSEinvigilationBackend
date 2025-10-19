import express from "express";
import { supabase } from "../utils/supabaseClient.js";
import { authenticate, authorize } from "../utils/authMiddleware.js";

const router = express.Router();

router.post("/exam-days", authenticate, authorize("dean"), async (req, res) => {
  try {
    const { date } = req.body;
    const { error } = await supabase.from("exam_days").insert([{ date, created_by: req.user.id }]);
    if (error) throw error;
    res.json({ message: "Exam day added" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/time-slots", authenticate, authorize("dean"), async (req, res) => {
  try {
    const { start_time, end_time } = req.body;
    const { error } = await supabase.from("time_slots").insert([{ start_time, end_time, created_by: req.user.id }]);
    if (error) throw error;
    res.json({ message: "Time slot added" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/classrooms", authenticate, authorize("dean"), async (req, res) => {
  try {
    const { room_number, capacity } = req.body;
    const { error } = await supabase.from("classrooms").insert([{ room_number, capacity, created_by: req.user.id }]);
    if (error) throw error;
    res.json({ message: "Classroom added" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/generate-schedule", authenticate, authorize("dean"), async (req, res) => {
  try {
    const { data: days } = await supabase.from("exam_days").select("id");
    const { data: slots } = await supabase.from("time_slots").select("id");
    const { data: rooms } = await supabase.from("classrooms").select("id");

    const schedule = [];
    for (const day of days)
      for (const slot of slots)
        for (const room of rooms)
          schedule.push({ exam_day_id: day.id, slot_id: slot.id, classroom_id: room.id });

    const { error } = await supabase.from("exam_schedule").insert(schedule, { upsert: true });
    if (error) throw error;

    res.json({ message: "Schedule generated" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;