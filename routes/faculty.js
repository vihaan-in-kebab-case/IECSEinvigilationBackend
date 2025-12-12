import express from "express";
import { supabase } from "../utils/supabaseClient.js";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "Faculty route working" });
});

export default router;