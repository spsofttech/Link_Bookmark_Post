const http = require("http");

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
        });
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testSignIn() {
  const email = "manual_test_1790418486182@example.com";
  const password = "Password123!";

  console.log("=== 1. Getting CSRF token ===");
  const csrfRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/csrf",
    method: "GET",
  });
  console.log("CSRF response status:", csrfRes.statusCode);
  const csrfData = JSON.parse(csrfRes.data);
  const csrfToken = csrfData.csrfToken;
  const csrfCookie = csrfRes.headers["set-cookie"] ? csrfRes.headers["set-cookie"].map(c => c.split(";")[0]).join("; ") : "";
  console.log("CSRF Token:", csrfToken);
  console.log("CSRF Cookie:", csrfCookie);

  console.log("\n=== 2. Posting credentials to /api/auth/callback/credentials ===");
  const body = new URLSearchParams({
    csrfToken: csrfToken,
    email: email,
    password: password,
    json: "true",
  }).toString();

  const authRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/callback/credentials",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
      Cookie: csrfCookie,
    },
  }, body);

  console.log("Auth response status:", authRes.statusCode);
  console.log("Auth response body:", authRes.data);
  console.log("Auth set-cookie headers:", authRes.headers["set-cookie"]);

  const authCookies = (authRes.headers["set-cookie"] || []).map(c => c.split(";")[0]).join("; ");
  const allCookies = [csrfCookie, authCookies].filter(Boolean).join("; ");

  console.log("\n=== 3. Accessing /dashboard/bookmarks ===");
  const dashRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/dashboard/bookmarks",
    method: "GET",
    headers: {
      Cookie: allCookies,
    },
  });

  console.log("Dashboard response status:", dashRes.statusCode);
  console.log("Dashboard location (if redirected):", dashRes.headers.location);
  console.log("Dashboard HTML length:", dashRes.data.length);
  console.log("Dashboard contains Karakeep / Bookmarks content:", dashRes.data.includes("Bookmarks") || dashRes.data.includes("Karakeep") || dashRes.data.includes("dashboard"));

  console.log("\n=== 4. Fetching bookmarks through tRPC (bookmarks.getBookmarks) ===");
  const trpcInput = encodeURIComponent(JSON.stringify({
    "0": {
      json: {}
    }
  }));

  const trpcRes = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/trpc/bookmarks.getBookmarks?batch=1&input=${trpcInput}`,
    method: "GET",
    headers: {
      Cookie: allCookies,
    },
  });

  console.log("tRPC bookmarks status:", trpcRes.statusCode);
  const parsedBookmarks = JSON.parse(trpcRes.data);
  console.log("tRPC bookmarks result keys:", Object.keys(parsedBookmarks[0] || {}));
  if (parsedBookmarks[0]?.result) {
    console.log("Bookmarks data retrieved successfully! Items count:", parsedBookmarks[0].result.data.json?.bookmarks?.length);
  } else {
    console.log("tRPC error:", parsedBookmarks[0]?.error);
  }
}

testSignIn().catch(console.error);
