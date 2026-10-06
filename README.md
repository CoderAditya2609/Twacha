<<<<<<< HEAD
# Twacha

Twacha is a personalized skincare-assistant demo built for a university assignment. It uses email sign-in, a Supabase database, streaming assistant replies, a controlled product catalogue, affiliate-click tracking, and an admin-only hypothetical earnings dashboard.

## 1. Set up Supabase

1. In your Supabase project, open **SQL Editor** in the left sidebar.
2. Select **New query**.
3. Open this project's `supabase.sql`, copy everything in it, paste it into the editor, and click **Run**. This creates the profile, message and click tables with security rules.
4. Open **Authentication → Providers → Email**. For this demo, turn off **Confirm email** so sign-up works immediately. (Keep it enabled in a real public app.)
5. Open **Project Settings → API**. Copy the Project URL, anon/public key, and service-role key. The service-role key is secret: do not put it in browser code or share it.

## 2. Configure locally

1. Duplicate `.env.example` and name the copy `.env.local`.
2. Fill in every Supabase value from the previous section.
3. Choose an assistant provider by setting `AI_PROVIDER` to `openai`, `gemini`, or `nvidia`, then add your own `AI_API_KEY` and compatible `AI_MODEL`.
4. Set `ADMIN_EMAILS` to the email address you will use to make your account (comma-separate multiple addresses).
5. In a terminal in this folder, run `npm install` and then `npm run dev`.
6. Open the local address shown in the terminal, create an account, complete the profile, and test the chat.

Never commit `.env.local`, your API key, or Supabase service-role key. They are already ignored by Git.

## 3. Deploy on Vercel

1. Create a **private** GitHub repository and push this whole project to it.
2. In Vercel, choose **Add New → Project**, import that GitHub repository, and leave the framework preset as **Next.js**.
3. Before the first deployment, open **Project Settings → Environment Variables** and add every variable shown in `.env.example`, with your real values. Add them to Production, Preview and Development if offered.
4. Deploy. Vercel will build the app automatically.
5. Each time you change an environment variable, go to **Deployments** and redeploy; changing it alone does not update an existing deployment.
6. Use a fresh test email to test sign-up, onboarding, chat, products, product links and the admin page.

## Notes

- Assistant messages are limited to 30 user messages per account per day.
- The admin screen is protected by a server-verified email allow-list (`ADMIN_EMAILS`).
- The `example.com` catalogue links are deliberate placeholders for the assignment. Replace only `affiliate_url` values in `data/products.json` if you later have real affiliate URLs.
- The chat function uses a 60-second limit, the documented configurable maximum for a Hobby function when Fluid compute is not available. Keep assistant answers short to avoid timeouts.
=======
# Twacha
>>>>>>> ce63b822c7aecaf94cb2387a2c3b0bbadcffefa8
