import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // <-- Add string id
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: false },
    avatarUrl: { type: String, required: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: String },
    createdAt: String,
    updatedAt: String,
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
