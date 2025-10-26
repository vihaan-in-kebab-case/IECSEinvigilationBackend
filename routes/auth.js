import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabaseClient.js";
const router = express.Router();

router.post("/register", async (req, res) => {
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