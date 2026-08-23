const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

export async function generateEnrichment(text: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const response = await fetch(
    `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Return a JSON object with exactly "summary" (2-3 sentences) and "tags" (an array of 3-5 strings) for this content:\n\n${text}`,
              },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Gemini request failed (${response.status}): ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("AI returned empty response");

  return JSON.parse(content) as { summary: string; tags: string[] };
}
