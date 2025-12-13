import { supabase } from "../utils/supabaseAdmin.js";

export async function requireDean(req, res, next) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", req.user.id)
    .single();

  if (error || data.role !== "dean") {
    return res.status(403).json({ message: "Dean access only" });
  }

  next();
}