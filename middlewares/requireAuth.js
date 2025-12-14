import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabaseAdmin.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.SUPABASE_JWT_SECRET
    );

    const userId = decoded.sub;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, role, faculty_type")
      .eq("id", userId)
      .single();

    if (!profile) {
      return res.status(403).json({
        message: "User not onboarded"
      });
    }

    req.user = {
      id: profile.id,
      role: profile.role,
      facultyType: profile.faculty_type
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}