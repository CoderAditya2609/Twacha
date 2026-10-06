import OpenAI from "openai";
import { GoogleGenAI } from "@google/genai";

export async function* streamChat({ systemPrompt, history, userMessage }) {
  const provider = process.env.AI_PROVIDER?.toLowerCase();
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey) throw new Error("The assistant has not been configured yet. Add AI_API_KEY to the server environment.");
  if (!model) throw new Error("The assistant model has not been configured yet. Add AI_MODEL to the server environment.");
  if (provider === "openai" || provider === "nvidia") {
    const client = new OpenAI({ apiKey, baseURL: process.env.AI_BASE_URL || (provider === "nvidia" ? "https://integrate.api.nvidia.com/v1" : undefined) });
    const stream = await client.chat.completions.create({ model, stream: true, temperature: 0.4, max_tokens: 700, messages: [{ role: "system", content: systemPrompt }, ...history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })), { role: "user", content: userMessage }] });
    for await (const part of stream) { const text = part.choices?.[0]?.delta?.content; if (text) yield text; }
    return;
  }
  if (provider === "gemini") {
    const client = new GoogleGenAI({ apiKey });
    const contents = [...history.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })), { role: "user", parts: [{ text: userMessage }] }];
    const stream = await client.models.generateContentStream({ model, contents, config: { systemInstruction: systemPrompt, temperature: 0.4, maxOutputTokens: 700 } });
    for await (const part of stream) if (part.text) yield part.text;
    return;
  }
  throw new Error("AI_PROVIDER must be openai, gemini, or nvidia.");
}
