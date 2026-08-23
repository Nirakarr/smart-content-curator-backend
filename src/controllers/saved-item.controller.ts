import { Request, Response } from "express";
import { scrapeWebsite } from "../services/scraper.service";
import { generateEnrichment } from "../services/ai.service";
import { itemRepository } from "../repositories/saved-item.repository";
import { createTags } from "../utils/tag.utils";

export const createItem = async (req: Request, res: Response) => {
  let savedItemId: string | undefined;

  try {
    const { url } = req.body;
    const user = await itemRepository.getDemoUser();
    const existing = await itemRepository.findByUserAndUrl(user.id, url);

    if (existing) {
      res.status(200).json({ data: existing, cached: true });
      return;
    }

    const pendingItem = await itemRepository.createPending(user.id, url);
    savedItemId = pendingItem.id;

    const metadata = await scrapeWebsite(url);
    const fallbackSummary =
      metadata.contentToAnalyze.slice(0, 300).trim() || metadata.title;
    const fallbackTags = createTags(metadata.title, metadata.source);

    let summary = fallbackSummary;
    let tagNames = fallbackTags;
    try {
      const enrichment = await generateEnrichment(metadata.contentToAnalyze);
      summary = enrichment.summary || fallbackSummary;
      tagNames = enrichment.tags.length > 0 ? enrichment.tags : fallbackTags;
    } catch (error) {
      console.warn("AI enrichment unavailable; using local enrichment:", error);
    }

    const item = await itemRepository.complete(
      pendingItem.id,
      { ...metadata, summary },
      tagNames,
    );

    res.status(201).json({ data: item });
  } catch (error) {
    console.error("Failed to create item:", error);
    if (savedItemId) {
      try {
        await itemRepository.markFailed(
          savedItemId,
          error instanceof Error ? error.message : "Unknown error",
        );
      } catch (statusError) {
        console.error("Failed to mark item as failed:", statusError);
      }
    }
    res.status(500).json({ error: "Failed to create item" });
  }
};

export const getItems = async (req: Request, res: Response) => {
  const { tag, search, page = 1, pageSize = 10 } = req.query;

  try {
    const user = await itemRepository.getDemoUser();
    if (!user) {
      res.status(200).json({
        data: [],
        totalCount: 0,
        filteredCount: 0,
        totalPages: 0,
      });
      return;
    }

    const { items, totalCount, filteredCount, totalPages } =
      await itemRepository.findMany(user.id, {
        tag: tag ? String(tag) : undefined,
        search: search ? String(search) : undefined,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined,
      });
    res.status(200).json({
      data: items,
      totalCount,
      filteredCount,
      totalPages,
    });
  } catch (error) {
    console.error("Failed to fetch items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

export const getItem = async (req: Request, res: Response) => {
  try {
    const user = await itemRepository.getDemoUser();
    const item = await itemRepository.findById(user.id, String(req.params.id));

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(200).json({ data: item });
  } catch (error) {
    console.error("Failed to fetch item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

export const getItemByTitle = async (req: Request, res: Response) => {
  try {
    const user = await itemRepository.getDemoUser();
    const item = await itemRepository.findByUserAndTitle(
      user.id,
      String(req.params.title),
    );

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    res.status(200).json({ data: item });
  } catch (error) {
    console.error("Failed to fetch item by title:", error);
    res.status(500).json({ error: "Failed to fetch item by title" });
  }
};

export const deleteItem = async (req: Request, res: Response) => {
  try {
    const user = await itemRepository.getDemoUser();
    const item = await itemRepository.findById(user.id, String(req.params.id));

    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }
    await itemRepository.delete(item.id);
    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};
