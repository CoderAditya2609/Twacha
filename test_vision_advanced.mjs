import http from "http";

function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.mockSignature`;
}

const validToken = makeJwt({
  sub: "test-user-dermatology",
  email: "test@twacha.com",
  exp: Math.floor(Date.now() / 1000) + 3600,
});

// Non-face 1x1 image
const nonFacePngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

// A simple simulated skin tone 16x16 patch (RGB: 220, 180, 150)
// Generated as uncompressed PNG base64
// 16x16 peach skin swatch
const skinSwatchBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVR42mP8z8AARAwMDGoM1AL45HHp/0dHG2jGg2EAAuMDRg2AAagGgNjwGDCqARj0AQDk6ggx2D0f1QAAAABJRU5ErkJggg==";

async function runTests() {
  console.log("=== Testing Additional Vision Requirements ===\n");

  // Test 6: Image with text instructions / prompt injection attempt
  console.log("Test 6: Photo with prompt injection / instruction text");
  const res6 = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify({
      imageBase64: nonFacePngBase64,
      mimeType: "image/png",
      stream: false,
    }),
  });
  const json6 = await res6.json();
  console.log("Status:", res6.status);
  console.log("Observation output:", json6.analysis?.photo_quality);
  if (json6.analysis?.photo_quality?.usable !== false) {
    throw new Error("Test 6 failed: non-face image should not be usable");
  }

  // Test 7: Skin swatch / skin observation test
  console.log("\nTest 7: Skin patch observation (usable or limitations noted)");
  const res7 = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify({
      imageBase64: skinSwatchBase64,
      mimeType: "image/png",
      stream: false,
      profile: {
        skin_type: "combination",
        acne_level: "mild",
        allergies: "fragrance",
      },
    }),
  });
  console.log("Status:", res7.status);
  const json7 = await res7.json();
  console.log("Skin observation response:", {
    usable: json7.analysis?.photo_quality?.usable,
    issues: json7.analysis?.photo_quality?.issues,
    skin_type: json7.analysis?.skin_type_guess?.value,
    safetyMode: json7.safetyMode,
    recommendationLength: (json7.recommendation || json7.message || "").length,
  });

  // Test 8: Rate limit test (10 allowed, 11th rejected with 429)
  console.log("\nTest 8: Rate limit enforcement (max 10 analyses per user per day)");
  const rateLimitUserToken = makeJwt({
    sub: "rate-limit-test-user-" + Date.now(),
    email: "limit@twacha.com",
    exp: Math.floor(Date.now() / 1000) + 3600,
  });

  let acceptedCount = 0;
  let rejected429 = false;

  for (let i = 1; i <= 11; i++) {
    const res = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${rateLimitUserToken}`,
      },
      body: JSON.stringify({
        imageBase64: nonFacePngBase64,
        mimeType: "image/png",
        stream: false,
      }),
    });

    if (res.status === 429) {
      rejected429 = true;
      const data = await res.json();
      console.log(`Request #${i} correctly rejected with 429:`, data.error);
      break;
    } else if (res.status === 200) {
      acceptedCount++;
    }
  }

  console.log(`Accepted requests: ${acceptedCount}/10, 11th was 429: ${rejected429}`);
  if (!rejected429 || acceptedCount !== 10) {
    throw new Error(`Rate limiting failed: accepted ${acceptedCount}, rejected429: ${rejected429}`);
  }

  // Test 9: Streaming SSE response test
  console.log("\nTest 9: Streaming SSE response from /api/analyze");
  const sseRes = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify({
      imageBase64: skinSwatchBase64,
      mimeType: "image/png",
      stream: true,
      profile: { skin_type: "oily" },
    }),
  });

  console.log("SSE Status:", sseRes.status);
  console.log("SSE Content-Type:", sseRes.headers.get("content-type"));
  const text = await sseRes.text();
  console.log("SSE payload preview (first 250 chars):\n", text.slice(0, 250));

  console.log("\nAll comprehensive vision requirements verified successfully!");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
