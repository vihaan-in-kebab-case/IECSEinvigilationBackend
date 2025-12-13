import express from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  ensureProfile,
  getMe
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/sync-profile", requireAuth, ensureProfile);
router.get("/me", requireAuth, getMe);

export default router;