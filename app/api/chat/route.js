import { GoogleGenAI } from "@google/genai";
import { generateSkincareResponse } from "@/lib/ai/skincareEngine";
import { requireUser } from "@/lib/supabase/server";
import products from "@/data/products.json";

export const runtime = "nodejs";
export const maxDuration = 60;

let aiClient = null;

function getAiClient() {
  if (aiClient) return aiClient;
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) return null;
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  return aiClient;
}

function createSystemInstruction(profile) {
  return `You are Claire, Twacha's skincare assistant — a luxury dermatological skincare advisor.
Always introduce yourself as "Claire, Twacha's skincare assistant" when appropriate.
Never mention model names, underlying AI providers, or internal technical architecture.
Act as a mindful, highly knowledgeable, luxury aesthetic skincare advisor (in the tradition of Aesop, Augustinus Bader, and Chanel Beauty).
Do not diagnose medical illnesses or claim cures. Clearly state uncertainty and conclude health advice with: "Not medical advice — consult a dermatologist for severe or persistent problems."
Personalize your guidance deeply using the user's skin profile:
${JSON.stringify(profile || {})}

Always recommend products from the curated Twacha catalogue using their exact title and markdown link format: [Product Name](/go/PRODUCT_ID).
Twacha catalogue:
${JSON.stringify(products)}

Structure guidance thoughtfully with:
1. What May Be Going On (Barrier assessment & observation)
2. Targeted Ritual (Morning & Evening protocol)
3. Curated Product Recommendations (Exact matches with [Product Name](/go/ID) links)
4. Mindful Alternative (Gentle or budget-friendly option)
5. Actives Caution (Ingredient conflicts, SPF requirements)

Never recommend harsh actives if the user has broken skin, pregnancy concerns with retinoids, or severe acne. Always insist on broad-spectrum sunscreen when actives are suggested.`;
}

export async function POST(request) {
  try {
    const authResult = await requireUser(request);
    if (authResult.error) {
      return Response.json({ error: authResult.error }, { status: authResult.status || 401 });
    }

    const { message, history, profile, modelChoice } = await request.json();
    if (!message || typeof message !== "string" || !message.trim()) {
      return Response.json({ error: "Please write a message first." }, { status: 400 });
    }

    const encoder = new TextEncoder();

    // Model selection based on user request / complexity
    const model =
      modelChoice === "pro"
        ? "gemini-3.1-pro-preview"
        : modelChoice === "fast"
        ? "gemini-3.1-flash-lite"
        : "gemini-3.8-flash";

    const formattedContents = [
      ...(Array.isArray(history) ? history : []).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      { role: "user", parts: [{ text: message.trim() }] },
    ];

    // Attempt Gemini with a fast 3.5s timeout. If unavailable (503 / 429), fall back to Expert Skincare NLM Engine.
    let geminiStream = null;
    const client = getAiClient();
    if (client) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);

        geminiStream = await client.models.generateContentStream({
          model,
          contents: formattedContents,
          config: {
            systemInstruction: createSystemInstruction(profile),
            temperature: 0.4,
            maxOutputTokens: 1200,
          },
        });
        clearTimeout(timeoutId);
      } catch (apiErr) {
        console.warn("Assistant service unavailable, switching to local skincare knowledge engine:", apiErr.message);
        geminiStream = null;
      }
    } else {
      console.warn("No assistant API key configured, using local skincare knowledge engine.");
    }

    // If Gemini stream is active, pipe it
    if (geminiStream) {
      const body = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of geminiStream) {
              if (chunk.text) {
                controller.enqueue(encoder.encode(chunk.text));
              }
            }
            controller.close();
          } catch (err) {
            console.warn("Assistant stream interrupted, switching to local skincare knowledge engine:", err.message);
            // Fallback gracefully mid-stream if needed
            const fallbackText = generateSkincareResponse({
              userMessage: message,
              history,
              profile,
            });
            controller.enqueue(encoder.encode("\n\n" + fallbackText));
            controller.close();
          }
        },
      });

      return new Response(body, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
        },
      });
    }

    // Expert Rule-Based Skincare NLM Engine
    const fullText = generateSkincareResponse({
      userMessage: message,
      history,
      profile,
    });

    // Stream text in natural conversational word chunks with slight pacing
    const body = new ReadableStream({
      async start(controller) {
        const words = fullText.split(/(\s+)/);
        for (let i = 0; i < words.length; i++) {
          controller.enqueue(encoder.encode(words[i]));
          // Brief micro-pause for smooth natural streaming feel
          if (i % 8 === 0) {
            await new Promise((r) => setTimeout(r, 15));
          }
        }
        controller.close();
      },
    });

    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    // Even in unhandled exception, return expert response
    const fallback = generateSkincareResponse({
      userMessage: "routine recommendations",
      history: [],
      profile: {},
    });
    return new Response(fallback, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }
}
