import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabaseClient.js";
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, password, name, role, facultyType, totalReqSlots } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const { error } = await supabase
      .from("users")
      .insert([{ username, password: hashed, name, role, facultyType, totalReqSlots }]);

    if (error) throw error;
    res.json({ message: "User registered successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const { data, error } = await supabase.from("users").select("*").eq("username", username).single();

    if (error || !data) throw new Error("Invalid username or password");
    const match = await bcrypt.compare(password, data.password);
    if (!match) throw new Error("Invalid username or password");

    const token = jwt.sign({ id: data.id, role: data.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, role: data.role });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

export default router;