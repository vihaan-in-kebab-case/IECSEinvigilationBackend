import { supabase } from "../utils/supabaseAdmin.js";

export async function assignSlot(req, res) {
  const { slotId } = req.params;
  const facultyId = req.user.id;

  const { count } = await supabase
    .from("exam_slots")
    .select("*", { count: "exact", head: true })
    .eq("assigned_faculty", facultyId);

  if (count >= req.faculty.daily_slot_limit) {
    return res.status(400).json({ message: "Daily slot limit reached" });
  }
  
  const { error } = await supabase
    .from("exam_slots")
    .update({ assigned_faculty: facultyId })
    .eq("id", slotId)
    .is("assigned_faculty", null);

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.json({ message: "Slot assigned successfully" });
}