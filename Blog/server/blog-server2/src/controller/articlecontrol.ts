import type { RequestHandler } from "express";
import Article from "../models/article";

export const GetArticlesController: RequestHandler = async (_req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: "Error fetching articles", error });
  }
};
