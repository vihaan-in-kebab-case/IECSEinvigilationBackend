import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { supabase } from "../utils/supabaseClient.js";
const router = express.Router();

router.post("/register", async (req, res) => {
});

export default router;