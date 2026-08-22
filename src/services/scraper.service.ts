import * as cheerio from "cheerio";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface ScrapedMetadata {
  title: string;
  description: string | null;
  author: string | null;
  publishedAt: Date | null;
  imageUrl: string | null;
  source: string | null;
  contentToAnalyze: string;
}

export async function scrapeWebsite(url: string): Promise<ScrapedMetadata> {
  try {
    // 1. Fetch the raw HTML
    // We add a basic User-Agent to prevent basic bot-blockers from rejecting the request
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL. Status: ${response.status}`);
    }

    const html = await response.text();

    // 2. Parse Meta Tags using Cheerio (Fast, good for OpenGraph tags)
    const $ = cheerio.load(html);
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "Unknown Title";
    const imageUrl =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      null;
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      null;
    const author =
      $('meta[name="author"]').attr("content") ||
      $('meta[property="article:author"]').attr("content") ||
      null;
    const publishedAtValue =
      $('meta[property="article:published_time"]').attr("content") ||
      $('meta[itemprop="datePublished"]').attr("content") ||
      null;
    const publishedAt = publishedAtValue ? new Date(publishedAtValue) : null;
    const source =
      $('meta[property="og:site_name"]').attr("content") ||
      new URL(url).hostname;

    // 3. Extract Clean Article Text using Mozilla Readability
    // This requires JSDOM to simulate a browser environment for Readability
    const doc = new JSDOM(html, { url });
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    let textContent = article?.textContent || "";

    // 4. Fallback Extraction
    // If Readability fails to find an "article" structure, fallback to grabbing all paragraph text
    if (!textContent || textContent.trim().length < 50) {
      let fallbackText = "";
      $("p").each((_, el) => {
        fallbackText += $(el).text() + " ";
      });
      textContent = fallbackText;
    }

    // 5. Cost-Awareness Truncation
    // Clean up excessive whitespace and truncate to 15,000 characters.
    // This ensures we give the LLM enough context to summarize without blowing up token limits.
    const cleanText = textContent.replace(/\s+/g, " ").trim();
    const contentToAnalyze = cleanText.substring(0, 15000);

    return {
      title: title.trim(),
      description,
      author,
      publishedAt:
        publishedAt && !Number.isNaN(publishedAt.getTime())
          ? publishedAt
          : null,
      imageUrl,
      source,
      contentToAnalyze,
    };
  } catch (error) {
    console.error(`Scraping failed for ${url}:`, error);
    throw new Error("Could not extract content from the provided URL.");
  }
}
