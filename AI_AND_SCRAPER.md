# AI and Scraper Integration

The Smart Content Curator backend uses a scraper and an AI service together to convert a web URL into an organized saved item.

## How It Works

When a user sends a URL to `POST /api/items`:

1. The URL is validated using Zod.
2. The scraper service downloads the web page.
3. It extracts the title, description, author, source, publication date, image, and readable article text.
4. The extracted article text is sent to the AI service.
5. The AI generates a short summary and relevant tags.
6. The summary, tags, and scraped metadata are saved in PostgreSQL using Prisma.
7. The completed item is returned to the client.

```text
User URL
   |
   v
Scraper Service
   |  page metadata + article text
   v
AI Service
   |  summary + tags
   v
Prisma Repository
   |  saved item in PostgreSQL
   v
API Response
```

## Scraper Service

The scraper is implemented in `src/services/scraper.service.ts`.

It uses:

- `fetch` to request the web page
- `Cheerio` to read HTML metadata
- `JSDOM` and Mozilla Readability to extract the main article content

The scraper first tries to extract clean article text with Readability. If that does not produce enough content, it falls back to collecting text from paragraph elements. The text is cleaned and limited to 15,000 characters before being sent to the AI service.

The scraper returns a `ScrapedMetadata` object containing the page information and a `contentToAnalyze` field for AI processing.

## AI Service

The AI integration is implemented in `src/services/ai.service.ts` using Google's Gemini API and its free usage tier.

The `generateEnrichment` function sends `contentToAnalyze` to Gemini's `generateContent` API. It uses the `gemini-3.6-flash` model and asks it to return JSON containing:

```json
{
  "summary": "A short summary of the article.",
  "tags": ["technology", "web", "news"]
}
```

The generated summary is stored on the saved item, and each generated tag is stored through the `Tag` and `ItemTag` database tables.

## Fallback Behavior

AI enrichment is optional for saving content. If the API key is missing, invalid, or the xAI request fails, the backend uses local fallback logic:

- The first 300 characters of the scraped article become the summary.
- Tags are generated from the page title and source.

Therefore, a temporary AI failure does not prevent successfully scraped content from being saved. A scraping failure marks the item as failed and returns an error response.

## Configuration

Add the following values to `.env`:

```env
DATABASE_URL="your-postgresql-connection-string"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-3.6-flash"
```

Create a Gemini API key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey). The backend loads these variables using `dotenv`.

## Main Files

- `src/controllers/saved-item.controller.ts` coordinates scraping, AI enrichment, fallback handling, and the API response.
- `src/services/scraper.service.ts` extracts webpage metadata and article text.
- `src/services/ai.service.ts` calls the Gemini API and returns the summary and tags.
- `src/repositories/saved-item.repository.ts` saves the item and its metadata in PostgreSQL.
- `src/utils/tag.utils.ts` provides local tags when AI enrichment is unavailable.
