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
     - **Gemini**: `gemini-3.8-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite`, or `gemini-3.1-flash-lite`.
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

- `POST /api/analyze`: Multimodal skin photo observation endpoint (Node.js runtime, maxDuration: 300s on Vercel's Hobby plan). Verifies the user's access token, accepts a single JPEG/PNG/WebP image up to 3 MB (base64 or multipart), enforces a limit of 10 analyses per user per day (counted from the messages table), sends the photo to a real vision-capable model that returns structured observation JSON, applies the deterministic safety layer, and then streams catalog-tailored guidance in the same six-section structure as chat. Photos are processed in memory only — never written to Supabase, Firestore, or disk, and never logged. Unusable photos (blurry, dark, face not visible, heavy makeup/filter, or not a face) are rejected with a friendly message instead of being guessed. Unparseable model output is retried once before failing gracefully.
- `POST /api/chat`: Text consultation chat endpoint with streaming advice and catalog matching.
- `GET /api/admin`: Administrative metrics dashboard.

## 4. Photo Analysis Safety Rules

The deterministic safety layer (plain code, not the model) enables safety mode when the observation reports severe acne, nodules/cysts, any red flag, or the user's profile has the pregnancy/prescription flag. In safety mode the streamed advice must not recommend active ingredients (retinoids, acids, benzoyl peroxide) and must direct the user to a dermatologist; gentle cleanser, barrier moisturizer, and broad-spectrum sunscreen remain allowed.
