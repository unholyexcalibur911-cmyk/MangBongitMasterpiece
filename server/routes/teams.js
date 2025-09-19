import { Router } from "express";
import Team from "../models/Team.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const teams = await Team.find();
  res.json(teams);
});

router.get("/mine", requireAuth, async (req, res) => {
  const teams = await Team.find({ "members.userId": req.user.sub });
  res.json(teams);
});

router.post("/", requireAuth, async (req, res) => {
  const { name, description, settings } = req.body;
  const teamId = `team_${Math.random().toString(36).slice(2, 9)}`;
  const team = await Team.create({
    id: teamId,
    name,
    description,
    settings,
    members: [
      {
        userId: req.user.sub,
        email: req.user.email,
        role: "owner",
        isActive: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const io = req.app.get("io");
  if (io) io.emit("team:created", team); // Broadcast team creation
  res.status(201).json({ ok: true, team });
});

router.post("/:id/join", requireAuth, async (req, res) => {
  const team = await Team.findOne({ id: req.params.id });
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (!team.members.some((m) => m.userId === req.user.sub)) {
    team.members.push({
      userId: req.user.sub,
      email: req.user.email,
      role: "member",
      isActive: true,
    });
    team.updatedAt = new Date().toISOString();
    await team.save();
    const io = req.app.get("io");
    if (io) io.emit("team:updated", team); // Broadcast team update
  }
  res.json({ ok: true, team });
});

// Add similar socket emits for update and delete if you have those routes
export default router;
