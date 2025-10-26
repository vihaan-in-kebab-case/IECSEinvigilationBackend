import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabaseClient.js";

const router = express.Router();

// ✅ SIGNUP ROUTE
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

// ✅ LOGIN ROUTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !userData)
      return res.status(401).json({ error: "Invalid email or password" });

    const validPassword = await bcrypt.compare(password, userData.password);
    if (!validPassword)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { email: userData.email, role: userData.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.status(200).json({ message: "Login successful", user: userData, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
