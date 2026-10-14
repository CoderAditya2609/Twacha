// Test script for Twacha photo skin analysis
import http from "http";

function makeJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64");
  return `${header}.${body}.mockSignature`;
}

const validToken = makeJwt({
  sub: "test-user-12345",
  email: "test@example.com",
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const expiredToken = makeJwt({
  sub: "test-user-12345",
  email: "test@example.com",
  exp: Math.floor(Date.now() / 1000) - 3600,
});

// 1x1 green PNG base64 (landscape / non-face)
const nonFacePngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function runTests() {
  console.log("=== Twacha Photo Skin Analysis Test Suite ===\n");

  // Test 1: No auth token
  console.log("Test 1: Reject request without auth token");
  const res1 = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64: nonFacePngBase64, mimeType: "image/png" }),
  });
  console.log("Status:", res1.status, "(Expected: 401)");
  const json1 = await res1.json();
  console.log("Response:", json1);
  if (res1.status !== 401) throw new Error("Test 1 failed: Expected 401");

  // Test 2: Expired auth token
  console.log("\nTest 2: Reject request with expired token");
  const res2 = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${expiredToken}`,
    },
    body: JSON.stringify({ imageBase64: nonFacePngBase64, mimeType: "image/png" }),
  });
  console.log("Status:", res2.status, "(Expected: 401)");
  const json2 = await res2.json();
  console.log("Response:", json2);
  if (res2.status !== 401) throw new Error("Test 2 failed: Expected 401");

  // Test 3: Unsupported file type
  console.log("\nTest 3: Reject unsupported MIME type");
  const res3 = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify({ imageBase64: nonFacePngBase64, mimeType: "application/pdf" }),
  });
  console.log("Status:", res3.status, "(Expected: 400)");
  const json3 = await res3.json();
  console.log("Response:", json3);
  if (res3.status !== 400) throw new Error("Test 3 failed: Expected 400");

  // Test 4: Oversized image (> 3 MB)
  console.log("\nTest 4: Reject oversized image (> 3 MB)");
  const largeBase64 = "A".repeat(4.5 * 1024 * 1024);
  const res4 = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${validToken}`,
    },
    body: JSON.stringify({ imageBase64: largeBase64, mimeType: "image/jpeg" }),
  });
  console.log("Status:", res4.status, "(Expected: 400)");
  const json4 = await res4.json();
  console.log("Response:", json4);
  if (res4.status !== 400) throw new Error("Test 4 failed: Expected 400");

  // Test 5: Non-face / unusable image
  console.log("\nTest 5: Analyze non-face image (should mark usable=false)");
  const res5 = await fetch("http://localhost:3000/api/analyze", {
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
  console.log("Status:", res5.status, "(Expected: 200)");
  const json5 = await res5.json();
  console.log("Unusable:", json5.unusable, "Issues:", json5.analysis?.photo_quality?.issues);
  console.log("Message:", json5.message);
  if (json5.analysis?.photo_quality?.usable !== false) {
    console.warn("Warning: Expected usable: false for non-face image");
  }

  console.log("\nAll API tests executed successfully!");
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
