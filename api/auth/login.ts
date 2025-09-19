import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // TODO: replace with real authentication (database, Firebase, etc.)
  if (email === "test@example.com" && password === "password123") {
    return res.status(200).json({ message: "Login success", token: "fake-jwt-token" });
  }

  return res.status(401).json({ message: "Invalid credentials" });
}
