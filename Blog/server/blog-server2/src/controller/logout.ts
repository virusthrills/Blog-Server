import type { RequestHandler } from "express";
import User from "../models/users";

export const logout: RequestHandler = async (req, res) => {
  try {
    const { refreshToken: incomingRefreshToken } = req.body ?? {};
    if (!incomingRefreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    await User.findOneAndUpdate(
      { refreshToken: incomingRefreshToken },
      { refreshToken: null },
      { new: true },
    );
    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("Logout failed", error);
    res.status(500).json({ message: "Unable to logout" });
  }
};
