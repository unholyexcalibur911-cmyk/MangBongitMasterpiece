import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// Reuse client across function invocations (important for Vercel)
let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;

  const uri = process.env.MONGODB_URI!;
  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  return cachedClient;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DB || "pms");
    const users = db.collection("users");

    const user = await users.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Compare hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login success",
      user: { id: user._id, email: user.email, name: user.name }
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
