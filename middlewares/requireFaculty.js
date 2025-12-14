import { supabase } from "../utils/supabaseAdmin.js";

export async function requireFaculty(req, res, next) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, faculty_scale")
    .eq("id", req.user.id)
    .single();

  if (error || data.role !== "faculty") {
    return res.status(403).json({ message: "Faculty access only" });
  }

  req.faculty = data;
  next();
}