import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

// Reuse client across invocations
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
    const { email, password, name } = req.body as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const client = await connectToDatabase();
    const db = client.db(process.env.MONGODB_DB || "pms");
    const users = db.collection("users");

    // Check if user exists
    const existing = await users.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await users.insertOne({
      name,
      email,
      passwordHash: hashedPassword, // <-- use passwordHash
      createdAt: new Date()
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: { id: result.insertedId, email, name }
    });
  } catch (error: any) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
