import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { RequestHandler } from "express";
import User from "../models/users";
import type { AuthTokenPayload, UserRole } from "../types";

const saveRefreshTokenForUser = async (
  userId: string,
  token: string,
): Promise<void> => {
  await User.findByIdAndUpdate(userId, { refreshToken: token }, { new: true });
};

const getAccessTokenSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT secret is not defined");
  }
  return secret;
};

const getRefreshTokenSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error("JWT refresh secret is not defined");
  }
  return secret;
};

const getTokenOptions = (
  value: string | undefined,
  fallback: string,
): SignOptions => ({
  expiresIn: (value ?? fallback) as NonNullable<SignOptions["expiresIn"]>,
});

const createAccessToken = (user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  role: UserRole;
}): string => {
  const tokenPayload: AuthTokenPayload = {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    role: user.role,
  };
  return jwt.sign(
    tokenPayload,
    getAccessTokenSecret(),
    getTokenOptions(process.env.JWT_EXPIRES_IN, "1h"),
  );
};

const createRefreshToken = (user: {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  role: UserRole;
}): string => {
  const tokenPayload: AuthTokenPayload = {
    id: user._id.toString(),
    email: user.email,
    firstName: user.firstName,
    role: user.role,
  };
  return jwt.sign(
    tokenPayload,
    getRefreshTokenSecret(),
    getTokenOptions(process.env.JWT_REFRESH_EXPIRES_IN, "7d"),
  );
};

export const register: RequestHandler = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body ?? {};
    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      res.status(400).json({
        message:
          "First name, last name, email, and a password of at least 8 characters are required",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      password,
    });
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    await saveRefreshTokenForUser(String(user._id), refreshToken);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Registration failed", error);
    if (error instanceof Error && error.message === "JWT secret is not defined") {
      res.status(500).json({ message: "JWT secret is not defined" });
      return;
    }
    if (
      error instanceof Error &&
      error.message === "JWT refresh secret is not defined"
    ) {
      res.status(500).json({ message: "JWT refresh secret is not defined" });
      return;
    }
    if (error instanceof mongoose.Error.ValidationError) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: "Unable to register user" });
  }
};

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email ||
      !password
    ) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    await saveRefreshTokenForUser(String(user._id), refreshToken);
    res.status(200).json({
      message: "Login successful",
      token: accessToken,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login failed", error);
    if (error instanceof Error && error.message === "JWT secret is not defined") {
      res.status(500).json({ message: "JWT secret is not defined" });
      return;
    }
    if (
      error instanceof Error &&
      error.message === "JWT refresh secret is not defined"
    ) {
      res.status(500).json({ message: "JWT refresh secret is not defined" });
      return;
    }
    res.status(500).json({ message: "Unable to login" });
  }
};

export const refreshToken: RequestHandler = async (req, res) => {
  try {
    const { refreshToken: incomingRefreshToken } = req.body ?? {};
    if (typeof incomingRefreshToken !== "string" || !incomingRefreshToken) {
      res.status(401).json({ message: "Refresh token is required" });
      return;
    }

    const decoded = jwt.verify(incomingRefreshToken, getRefreshTokenSecret());
    if (typeof decoded === "string" || typeof decoded.id !== "string") {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }
    if (user.refreshToken !== incomingRefreshToken) {
      res.status(403).json({ message: "Refresh token is invalid or expired" });
      return;
    }

    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);
    await saveRefreshTokenForUser(String(user._id), newRefreshToken);
    res.status(200).json({
      message: "Token refreshed successfully",
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token failed", error);
    if (
      error instanceof Error &&
      error.message === "JWT refresh secret is not defined"
    ) {
      res.status(500).json({ message: "JWT refresh secret is not defined" });
      return;
    }
    res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

export const getAllUsers: RequestHandler = async (_req, res) => {
  try {
    const users = await User.find({}).select("-password -refreshToken");
    res.status(200).json(users);
  } catch (error) {
    console.error("Failed to fetch users", error);
    res.status(500).json({ message: "Unable to fetch users" });
  }
};

export const updateUserRole: RequestHandler = async (req, res) => {
  const { role } = req.body ?? {};
  const allowedRoles: UserRole[] = ["user", "admin", "manager"];
  if (typeof role !== "string" || !allowedRoles.includes(role as UserRole)) {
    res.status(400).json({ message: "Role must be user, admin, or manager" });
    return;
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    ).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ message: "User role updated", user });
  } catch (error) {
    console.error("Failed to update user role", error);
    res.status(400).json({ message: "Invalid user id" });
  }
};
