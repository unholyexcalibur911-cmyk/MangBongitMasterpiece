import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Temporary in-memory storage for development
const users = new Map();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      id: `user_${Math.random().toString(36).slice(2, 9)}`,
      email,
      passwordHash,
      name,
      role: role || "user", // Use the role from request body, default to 'user'
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    res
      .status(201)
      .json({
        ok: true,
        user: { email: user.email, name: user.name, id: user.id },
      });
  } catch (e) {
    console.error("Register error:", e);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password, userType } = req.body;
  console.log("Login attempt:", { email, userType });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  console.log("User found:", { email: user.email, role: user.role });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  // Check if user type matches the login section
  if (userType && user.role !== userType) {
    console.log("Role mismatch:", { userType, userRole: user.role });
    return res.status(403).json({
      error: `This account is registered as ${user.role}. Please use the ${user.role} login section.`,
    });
  }

  console.log("Login successful for:", { email: user.email, role: user.role });

  // Generate JWT token
  const token = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({
    ok: true,
    token, // <-- frontend expects this!
    user: { email: user.email, name: user.name, id: user.id, role: user.role },
  });
});

export default router;
