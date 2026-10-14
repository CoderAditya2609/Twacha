import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

import fs from "fs";
import path from "path";

function readEnvLocalKey(name) {
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
      const text = fs.readFileSync(envPath, "utf8");
      const match = text.match(new RegExp(`^${name}=([^\\r\\n]+)`, "m"));
      if (match && match[1]) {
        return match[1].trim();
      }
    }
  } catch {}
  return null;
}

export function getActiveConfig() {
  let geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === "MY_GEMINI_API_KEY") {
    geminiKey = readEnvLocalKey("GEMINI_API_KEY") || geminiKey;
  }

  let aiKey = process.env.AI_API_KEY;
  if (!aiKey || aiKey === "replace_with_your_server_side_key") {
    aiKey = readEnvLocalKey("AI_API_KEY") || aiKey;
  }

  const apiKey =
    aiKey && aiKey !== "replace_with_your_server_side_key"
      ? aiKey
      : geminiKey;

  const provider =
    process.env.AI_PROVIDER &&
    aiKey &&
    aiKey !== "replace_with_your_server_side_key"
      ? process.env.AI_PROVIDER.toLowerCase()
      : geminiKey
      ? "gemini"
      : process.env.AI_PROVIDER?.toLowerCase() || "gemini";

  const model =
    process.env.AI_MODEL && process.env.AI_MODEL !== "gpt-5-mini"
      ? process.env.AI_MODEL
      : provider === "gemini"
      ? "gemini-2.5-flash"
      : "gpt-4o-mini";

  return { apiKey, provider, model };
}

function isOpenAiVisionModel(model) {
  if (!model) return false;
  const m = model.toLowerCase();
  return (
    m.includes("gpt-4o") ||
    m.includes("gpt-4-turbo") ||
    m.includes("gpt-4-vision") ||
    m.includes("chatgpt-4o") ||
    m.startsWith("o1") && !m.startsWith("o1-mini")
  );
}

function isNvidiaVisionModel(model) {
  if (!model) return false;
  const m = model.toLowerCase();
  return m.includes("vision") || m.includes("vl") || m.includes("neva") || m.includes("multimodal");
}

function isGeminiVisionModel(model) {
  if (!model) return false;
  const m = model.toLowerCase();
  if (
    m.includes("embedding") ||
    m.includes("tts") ||
    m.includes("transcribe") ||
    m.includes("audio")
  ) {
    return false;
  }
  return m.startsWith("gemini-") || m.startsWith("models/gemini");
}

export async function* streamChat({ systemPrompt, history, userMessage }) {
  const { apiKey, provider, model } = getActiveConfig();
  if (!apiKey) {
    throw new Error(
      "The assistant has not been configured yet. Add AI_API_KEY or GEMINI_API_KEY to the server environment."
    );
  }
  if (!model) {
    throw new Error("The assistant model has not been configured yet. Add AI_MODEL to the server environment.");
  }

  if (provider === "openai" || provider === "nvidia") {
    const client = new OpenAI({
      apiKey,
      baseURL:
        process.env.AI_BASE_URL ||
        (provider === "nvidia" ? "https://integrate.api.nvidia.com/v1" : undefined),
    });
    const stream = await client.chat.completions.create({
      model,
      stream: true,
      temperature: 0.4,
      max_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
        { role: "user", content: userMessage },
      ],
    });
    for await (const part of stream) {
      const text = part.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
    return;
  }

  if (provider === "gemini") {
    const client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    const contents = [
      ...history.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: userMessage }] },
    ];
    try {
      const stream = await client.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.4,
          maxOutputTokens: 800,
        },
      });
      for await (const part of stream) {
        if (part.text) yield part.text;
      }
      return;
    } catch (geminiErr) {
      // If primary model has high demand, retry with gemini-2.5-flash
      if (model !== "gemini-2.5-flash") {
        const fallbackStream = await client.models.generateContentStream({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.4,
            maxOutputTokens: 800,
          },
        });
        for await (const part of fallbackStream) {
          if (part.text) yield part.text;
        }
        return;
      }
      throw geminiErr;
    }
  }

  throw new Error("AI_PROVIDER must be openai, gemini, or nvidia.");
}

export async function analyzeImage({ systemPrompt, userText, imageBase64, mimeType }) {
  const { apiKey, provider, model } = getActiveConfig();
  console.log("analyzeImage running with:", {
    provider,
    model,
    apiKeyLength: apiKey?.length,
    apiKeyPrefix: apiKey?.slice(0, 8),
  });
  if (!apiKey) {
    throw new Error(
      "The assistant has not been configured yet. Add AI_API_KEY or GEMINI_API_KEY to the server environment."
    );
  }
  if (!model) {
    throw new Error("The assistant model has not been configured yet. Add AI_MODEL to the server environment.");
  }

  const effectiveMime = mimeType || "image/jpeg";

  if (provider === "gemini") {
    if (!isGeminiVisionModel(model)) {
      throw new Error(
        "The configured AI model does not support image analysis. Please configure a vision-capable model."
      );
    }

    const client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    const contents = [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: effectiveMime,
              data: imageBase64,
            },
          },
          {
            text: userText || "Analyze this skin photo following the requested JSON structure.",
          },
        ],
      },
    ];

    try {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      return response.text;
    } catch (err) {
      // If primary experienced high demand / 503, retry with gemini-2.5-flash
      if (model !== "gemini-2.5-flash") {
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash",
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });
        return response.text;
      }
      throw err;
    }
  }

  if (provider === "openai" || provider === "nvidia") {
    const isVision =
      provider === "nvidia" ? isNvidiaVisionModel(model) : isOpenAiVisionModel(model);

    if (!isVision) {
      throw new Error(
        "The configured AI model does not support image analysis. Please configure a vision-capable model."
      );
    }

    const client = new OpenAI({
      apiKey,
      baseURL:
        process.env.AI_BASE_URL ||
        (provider === "nvidia" ? "https://integrate.api.nvidia.com/v1" : undefined),
    });

    const response = await client.chat.completions.create({
      model,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userText || "Analyze this skin photo following the requested JSON structure.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${effectiveMime};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    });

    return response.choices?.[0]?.message?.content || "";
  }

  throw new Error("AI_PROVIDER must be openai, gemini, or nvidia.");
}
