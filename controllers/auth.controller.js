import { supabase } from "../utils/supabaseAdmin.js";

export async function ensureProfile(req, res) {
  const userId = req.user.id;
  const { role, faculty_scale } = req.body;

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (existing) {
    return res.json(existing);
  }

  if (!role || !["dean", "faculty"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  const dailySlotMap = {
    assistant: 1,
    associate: 2,
    senior_scale: 3,
  };

  const daily_slot_limit =
    role === "faculty"
      ? dailySlotMap[faculty_scale]
      : null;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email: req.user.email,
      role,
      faculty_scale,
      daily_slot_limit,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({ message: error.message });
  }

  res.status(201).json(data);
}

export async function getMe(req, res) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", req.user.id)
    .single();

  if (error) {
    return res.status(404).json({ message: "Profile not found" });
  }

  res.json(data);
}