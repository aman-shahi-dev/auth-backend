import express from "express";
import {
  registerUser,
  verifyUser,
  login,
  profile,
  logoutUser,
  resetPassword,
  forgotPassword
} from "../controllers/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);

router.get("/verify/:token", verifyUser);

router.post("/login", login);

router.get("/user-profile", isLoggedIn, profile);

router.get("/logout", isLoggedIn, logoutUser);

router.post("/reset-password/:token", resetPassword);

router.post("/forgot-password", forgotPassword)

export default router;
