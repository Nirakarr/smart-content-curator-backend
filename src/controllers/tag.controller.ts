import { Request, Response } from "express";
import { tagRepository } from "../repositories/tag.repository";

export const getTags = async (_req: Request, res: Response) => {
  try {
    const tags = await tagRepository.findAll();
    res.status(200).json({ data: tags });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    res.status(500).json({ error: "Failed to fetch tags" });
  }
};
