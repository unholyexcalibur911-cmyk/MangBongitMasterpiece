import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";
import { Server } from "socket.io";
import mongoose from "mongoose";

const router = Router();

// Temporary in-memory storage for development
const connections = new Map();

router.get("/me", requireAuth, async (req, res) => {
  const user = await User.findOne({ id: req.user.sub });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    email: user.email,
    name: user.name,
    role: user.role,
    isAdmin: user.role === "admin",
  });
});

router.patch("/me", requireAuth, async (req, res) => {
  const { name, avatarUrl } = req.body;
  const users = global.users || new Map();
  const me = users.get(req.user.email);
  if (!me) return res.status(404).json({ error: "Not found" });

  me.name = name || me.name;
  me.avatarUrl = avatarUrl || me.avatarUrl;
  users.set(req.user.email, me);
  global.users = users;

  return res.json({
    id: me.id,
    email: me.email,
    name: me.name,
    avatarUrl: me.avatarUrl,
  });
});

router.get("/", requireAuth, async (_req, res) => {
  const users = global.users || new Map();
  const allUsers = Array.from(users.values()).map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    avatarUrl: u.avatarUrl,
  }));
  return res.json(allUsers);
});

router.post("/ping", requireAuth, async (req, res) => {
  const { toUserId, message } = req.body || {};
  if (!toUserId) return res.status(400).json({ error: "toUserId is required" });
  // Send real-time notification if socket.io is available on app locals
  const io = req.app.get("io");
  if (io) {
    io.to(`user:${toUserId}`).emit("ping", {
      from: req.user.sub,
      message: message || "👋",
    });
  }
  return res.json({
    ok: true,
    from: req.user.sub,
    to: toUserId,
    message: message || "👋",
  });
});

// Connection endpoints
router.get("/connections", requireAuth, async (req, res) => {
  const userConnections = Array.from(connections.values()).filter(
    (conn) =>
      conn.userId === req.user.sub || conn.connectedUserId === req.user.sub,
  );
  return res.json(userConnections);
});

router.post("/connections", requireAuth, async (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId is required" });
  if (userId === req.user.sub)
    return res.status(400).json({ error: "Cannot connect to yourself" });

  // Check if connection already exists
  const existingConnection = Array.from(connections.values()).find(
    (conn) =>
      (conn.userId === req.user.sub && conn.connectedUserId === userId) ||
      (conn.userId === userId && conn.connectedUserId === req.user.sub),
  );

  if (existingConnection) {
    return res.status(409).json({ error: "Connection already exists" });
  }

  const connectionId = Date.now().toString();
  const connection = {
    id: connectionId,
    userId: req.user.sub,
    connectedUserId: userId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  connections.set(connectionId, connection);
  return res.json(connection);
});

router.patch("/connections/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const connection = connections.get(id);
  if (!connection)
    return res.status(404).json({ error: "Connection not found" });

  if (connection.connectedUserId !== req.user.sub) {
    return res
      .status(403)
      .json({ error: "Not authorized to modify this connection" });
  }

  connection.status = status;
  connections.set(id, connection);
  return res.json(connection);
});

router.delete("/connections/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const connection = connections.get(id);
  if (!connection)
    return res.status(404).json({ error: "Connection not found" });

  if (
    connection.userId !== req.user.sub &&
    connection.connectedUserId !== req.user.sub
  ) {
    return res
      .status(403)
      .json({ error: "Not authorized to delete this connection" });
  }

  connections.delete(id);
  return res.json({ ok: true });
});

export default router;
