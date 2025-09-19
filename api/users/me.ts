import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";

let cachedClient: MongoClient | null = null;
async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const uri = process.env.MONGODB_URI!;
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret-change-me",
    );
    if (typeof payload === "object" && payload !== null && "email" in payload) {
      const client = await connectToDatabase();
      const db = client.db(process.env.MONGODB_DB || "pms");
      const users = db.collection("users");
      const user = await users.findOne({
        email: (payload as jwt.JwtPayload).email,
      });
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      return res.status(401).json({ error: "Invalid token payload" });
    }
  } catch (e: any) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
