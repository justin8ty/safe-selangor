import { env } from "../config/env.ts";

export type GeminiModerationResult = {
  confidence: number;
  explanation: string;
};

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

function clampConfidence(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export async function moderateCrimeSceneWithGemini(input: {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  imageBase64: string;
  contextText: string;
  timeoutMs?: number;
}): Promise<GeminiModerationResult> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    input.timeoutMs ?? 15000,
  );

  try {
    const url = new URL(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    );
    url.searchParams.set("key", env.GEMINI_API_KEY);

    const prompt =
      "You are a content moderation classifier for a community crime reporting app. " +
      "Your task: decide how likely the image depicts a real-world crime/incident scene. " +
      "Return ONLY valid JSON with keys: confidence (0-100 integer) and explanation (short string). " +
      "Confidence means likelihood the image depicts a plausible crime/incident scene. " +
      "If the image is unrelated to a crime scene, confidence should be low.\n\n" +
      `Context: ${input.contextText}`;

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "content-type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: input.mimeType,
                  data: input.imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini HTTP ${res.status}: ${text}`);
    }

    const json = (await res.json()) as GeminiGenerateContentResponse;
    const text =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .filter(Boolean)
        .join("\n") ?? "";

    const parsed = JSON.parse(text) as {
      confidence?: unknown;
      explanation?: unknown;
    };

    return {
      confidence: clampConfidence(parsed.confidence),
      explanation:
        typeof parsed.explanation === "string" && parsed.explanation.length
          ? parsed.explanation
          : "No explanation provided",
    };
  } finally {
    clearTimeout(timeout);
  }
}
