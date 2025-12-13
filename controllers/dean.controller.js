import { supabase } from "../utils/supabaseClient.js";

export async function createExamSlot(req, res) {
  const { exam_date_id, time_slot_id, classroom_id } = req.body;

  const { data, error } = await supabase
    .from("exam_slots")
    .insert([{ exam_date_id, time_slot_id, classroom_id }])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ message: "Insert failed" });
  }

  res.status(201).json(data);
}