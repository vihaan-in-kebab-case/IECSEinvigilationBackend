import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabaseAdmin.js";
const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, role, username } = req.body;

    if (!email || !password || !name || !role || !username)
      return res.status(400).json({ error: "All fields are required" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([{ email, password: hashedPassword, name, role, username }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    const token = jwt.sign({ email, role }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    res.status(201).json({ message: "Signup successful", user: data[0], token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return res.status(401).json({ error: error.message });
        res.status(200).json({ message: "Login successful", user: data.user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
