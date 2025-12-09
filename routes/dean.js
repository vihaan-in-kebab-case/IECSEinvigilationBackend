import express from "express";
import { supabase } from "../utils/supabaseClient.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Dean route working" });
});

router.post("/exam-schedule", async (req, res) => {
  const { date, day, start_time, end_time, classroom } = req.body;

  if (!date || !day || !start_time || !end_time || !classroom) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const { data, error } = await supabase
    .from("exam_slots")
    .insert([{ date, day, start_time, end_time, classroom }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Could not create slot" });
  }

  return res.status(201).json({ message: "Slot created", slot: data });
});

router.get("/exam-slots", async (req, res) => {
  const { date, day } = req.query;

  let query = supabase.from("exam_slots").select("*");

  if (date) {
    query = query.eq("date", date);
  }

  if (day) {
    query = query.eq("day", day);
  }

  const { data, error } = await query
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return res.status(500).json({ message: "Could not fetch slots" });
  }

  return res.json({ slots: data });
});

router.put("/exam-schedule/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const { data, error } = await supabase
    .from("exam_slots")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Could not update slot" });
  }

  return res.json({ message: "Slot updated", slot: data });
});

router.delete("/exam-schedule/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("exam_slots")
    .delete()
    .eq("id", id);

  if (error) {
    return res.status(500).json({ message: "Could not delete slot" });
  }

  return res.json({ message: "Slot deleted" });
});

export default router;
