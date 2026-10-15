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
      ? "gemini-3.8-flash"
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
    m.includes("audio") ||
    m.includes("transcribe") ||
    m.includes("live")
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
      // If the primary model is overloaded/unavailable, retry on another model
      if (isTransientProviderError(geminiErr) && model !== GEMINI_FALLBACK_MODEL) {
        const fallbackStream = await client.models.generateContentStream({
          model: "gemini-3.8-flash",
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

const GEMINI_FALLBACK_MODEL = "gemini-3.5-flash-lite";

function isTransientProviderError(err) {
  const msg = String(err?.message || err || "").toLowerCase();
  return (
    /high demand|overloaded|unavailable|try again|internal error|timeout|timed out|rate ?limit|quota|503|429|fetch failed|network/.test(
      msg
    ) && !/does not support|not been configured/i.test(msg)
  );
}

function providerUnavailableError(err) {
  return new Error(`VISION_PROVIDER_UNAVAILABLE: ${err?.message || err}`);
}

/**
 * Returns a configuration error message when the active provider/model setup
 * cannot support image analysis, or null when it can. Never exposes secrets.
 */
export function getVisionConfigError() {
  const { apiKey, provider, model } = getActiveConfig();
  if (!apiKey) {
    return "The assistant has not been configured yet. Add AI_API_KEY or GEMINI_API_KEY to the server environment.";
  }
  if (!model) {
    return "The assistant model has not been configured yet. Add AI_MODEL to the server environment.";
  }
  if (provider === "gemini" && !isGeminiVisionModel(model)) {
    return "The configured AI model does not support image analysis. Please configure a vision-capable model.";
  }
  if (provider === "openai" && !isOpenAiVisionModel(model)) {
    return "The configured AI model does not support image analysis. Please configure a vision-capable model.";
  }
  if (provider === "nvidia" && !isNvidiaVisionModel(model)) {
    return "The configured AI model does not support image analysis. Please configure a vision-capable model.";
  }
  if (!["gemini", "openai", "nvidia"].includes(provider)) {
    return "AI_PROVIDER must be openai, gemini, or nvidia.";
  }
  return null;
}

export async function analyzeImage({ systemPrompt, userText, imageBase64, mimeType }) {
  const { apiKey, provider, model } = getActiveConfig();
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

    // Try the configured model first, then progressively other vision-capable models
    // when it is overloaded or temporarily unavailable.
    const candidateModels = [model];
    for (const m of [
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      GEMINI_FALLBACK_MODEL,
      "gemini-2.5-flash",
    ]) {
      if (!candidateModels.includes(m)) candidateModels.push(m);
    }

    let lastError = null;
    for (const candidate of candidateModels) {
      try {
        const response = await client.models.generateContent({
          model: candidate,
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        });
        return response.text;
      } catch (err) {
        lastError = err;
        if (!isTransientProviderError(err)) throw err;
      }
    }

    throw providerUnavailableError(lastError);
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

    try {
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
    } catch (err) {
      if (isTransientProviderError(err)) throw providerUnavailableError(err);
      throw err;
    }
  }

  throw new Error("AI_PROVIDER must be openai, gemini, or nvidia.");
}
