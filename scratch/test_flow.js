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

async function run() {
  console.log("=== STEP 1: Verify GET /signin ===");
  const signinRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/signin",
    method: "GET",
  });
  console.log("Signin Status:", signinRes.statusCode);
  console.log("Has signin form:", signinRes.data.includes("Sign In") || signinRes.data.includes("signin"));

  console.log("\n=== STEP 2: Verify GET /signup ===");
  const signupRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/signup",
    method: "GET",
  });
  console.log("Signup Status:", signupRes.statusCode);
  console.log("Has signup form:", signupRes.data.includes("Sign Up") || signupRes.data.includes("signup") || signupRes.data.includes("Create Your Account"));

  console.log("\n=== STEP 3: Verify Sign Up with existing email (gajerasiddharth10@gmail.com) ===");
  const duplicatePayload = JSON.stringify({
    "0": {
      name: "Siddharth Gajera",
      email: "gajerasiddharth10@gmail.com",
      password: "TestPassword123!",
      confirmPassword: "TestPassword123!",
    }
  });

  const dupRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/users.create?batch=1",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(duplicatePayload),
      },
    },
    duplicatePayload
  );
  console.log("Duplicate Signup Status:", dupRes.statusCode);
  console.log("Duplicate Signup Response:", dupRes.data);

  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "ValidPassword123!";
  console.log(`\n=== STEP 4: Verify Sign Up with new unique email (${testEmail}) ===`);
  const newPayload = JSON.stringify({
    "0": {
      name: "Manual Test User",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
    }
  });

  const newRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/users.create?batch=1",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(newPayload),
      },
    },
    newPayload
  );
  console.log("New Signup Status:", newRes.statusCode);
  console.log("New Signup Response:", newRes.data);

  console.log("\n=== STEP 5: Verify Sign In with the new user via NextAuth ===");
  // First, get CSRF token
  const csrfRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/auth/csrf",
    method: "GET",
  });
  console.log("CSRF Status:", csrfRes.statusCode);
  const csrfData = JSON.parse(csrfRes.data);
  const csrfToken = csrfData.csrfToken;
  const initialCookies = (csrfRes.headers["set-cookie"] || []).map((c) => c.split(";")[0]).join("; ");
  console.log("CSRF Token:", csrfToken);

  // Authenticate with credentials
  const credsBody = new URLSearchParams({
    csrfToken: csrfToken,
    email: testEmail,
    password: testPassword,
    json: "true",
  }).toString();

  const authRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/callback/credentials",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(credsBody),
        Cookie: initialCookies,
      },
    },
    credsBody
  );
  console.log("Auth Callback Status:", authRes.statusCode);
  console.log("Auth Callback Response:", authRes.data);
  
  const authCookiesList = authRes.headers["set-cookie"] || [];
  const sessionCookies = [
    initialCookies,
    ...authCookiesList.map((c) => c.split(";")[0]),
  ].filter(Boolean).join("; ");
  console.log("Session Cookies:", sessionCookies);

  console.log("\n=== STEP 6: Verify Dashboard Access with Authenticated Session ===");
  const dashRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/dashboard/bookmarks",
    method: "GET",
    headers: {
      Cookie: sessionCookies,
    },
  });
  console.log("Dashboard Status:", dashRes.statusCode);
  console.log("Dashboard Headers Location (if redirect):", dashRes.headers.location);
  console.log("Dashboard Page HTML received:", dashRes.data.length, "bytes");
  console.log("Contains Dashboard elements:", dashRes.data.includes("Karakeep") || dashRes.data.includes("bookmarks"));

  console.log("\n=== STEP 7: Verify tRPC API call with Authenticated Session ===");
  const inputParam = encodeURIComponent(JSON.stringify({ "0": {} }));
  const trpcRes = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/trpc/bookmarks.getBookmarks?batch=1&input=${inputParam}`,
    method: "GET",
    headers: {
      Cookie: sessionCookies,
    },
  });
  console.log("tRPC bookmarks.getBookmarks Status:", trpcRes.statusCode);
  console.log("tRPC bookmarks.getBookmarks Response:", trpcRes.data.slice(0, 300));

  console.log("\n=== STEP 8: Verify users.getStats with Authenticated Session ===");
  const statsRes = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/trpc/users.getStats?batch=1&input=${encodeURIComponent(JSON.stringify({ "0": {} }))}`,
    method: "GET",
    headers: {
      Cookie: sessionCookies,
    },
  });
  console.log("tRPC users.getStats Status:", statsRes.statusCode);
  console.log("tRPC users.getStats Response:", statsRes.data.slice(0, 300));
}

run().catch((err) => {
  console.error("Test run error:", err);
});
