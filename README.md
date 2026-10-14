# Twacha Skincare Atelier

Twacha is a luxury personalized skincare advisory application. It pairs clinical intelligence with bespoke formulations, honest actives, curated product recommendations, and real AI vision skin analysis.

## Key Features

- **AI Vision Skin Observation**: Real-time visual analysis of user-submitted skin photos. Uses genuine multimodal AI models to observe skin type, acne levels, barrier concerns, and red flags without diagnosing disease. Photos are processed in memory and never stored on disk or databases.
- **Two-Step Safety Gate**: Deterministic clinical safety rules activate when severe acne, cysts/nodules, red flags, or pregnancy/prescription flags are detected. Safety mode directs users to consult a dermatologist and restricts recommendations to gentle non-active basics (cleanser, barrier moisturizer, broad-spectrum sunscreen).
- **Personalized Streamed Consultations**: Natural, streaming dermatological guidance tailored to user skin profiles, climate, allergies, and curated catalog products.
- **Curated Catalogue**: Clinically formulated cleansers, serums, moisturizers, and sunscreens with ingredient breakdowns and transparent advice.
- **Client-Side Optimization**: Photos are automatically resized to a maximum of 1024px and compressed before uploading to minimize payload size and stay within serverless execution limits.

## 1. Setup & Environment

1. Duplicate `.env.example` and name the copy `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Configure your AI provider and model:
   - **`AI_PROVIDER`**: `gemini`, `openai`, or `nvidia`.
   - **`AI_MODEL`**: **Must be a vision-capable model** to support photo skin analysis:
     - **Gemini**: `gemini-2.5-flash`, `gemini-3.8-flash`, `gemini-3.1-flash-lite`, or `gemini-flash-latest`.
     - **OpenAI**: `gpt-4o`, `gpt-4o-mini`, or `gpt-4-turbo`.
     - **Nvidia**: `meta/llama-3.2-11b-vision-instruct` or other vision-capable NIM models.
   - **`AI_API_KEY`** or **`GEMINI_API_KEY`**: Set your server-side secret API key.

3. Optional: Set `ADMIN_EMAILS` (comma-separated email list) for administrator dashboard access.

## 2. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 3. API Routes

- `POST /api/analyze`: Multimodal skin observation endpoint (Node.js runtime, maxDuration: 60s). Verifies user authorization, validates image MIME and size (max 3 MB), applies rate limiting (max 10 analyses per user per day), generates structured observation JSON, applies the safety layer, and streams tailored catalog guidance.
- `POST /api/chat`: Text consultation chat endpoint with streaming advice and catalog matching.
- `GET /api/admin`: Administrative metrics dashboard.
