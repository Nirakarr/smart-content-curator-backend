const XAI_API_URL = "https://api.x.ai/v1/chat/completions";
const XAI_MODEL = process.env.XAI_MODEL ?? "grok-3-mini";

export async function generateEnrichment(text: string) {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) throw new Error("XAI_API_KEY is not configured");

  const response = await fetch(XAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: XAI_MODEL,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Output a JSON object with exactly: "summary" (2-3 sentences) and "tags" (array of 3-5 strings).`,
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `xAI request failed (${response.status}): ${await response.text()}`,
    );
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");

  return JSON.parse(content) as { summary: string; tags: string[] };
}
