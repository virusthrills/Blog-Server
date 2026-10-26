import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import type { UserRole } from "../types";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  refreshToken: string | null;
}

const userSchema = new Schema<User>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    match: [
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
    ],
  },
  role: {
    type: String,
    enum: ["user", "admin", "manager"],
    default: "user",
  },
  refreshToken: {
    type: String,
    default: null,
  },
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const salt = await bcrypt.genSalt(11);
  this.password = await bcrypt.hash(this.password, salt);
});

const UserModel = mongoose.model<User>("User", userSchema);

export default UserModel;
