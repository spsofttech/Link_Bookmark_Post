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

async function runVerification() {
  const results = [];
  const logStep = (stepNumber, title, passed, details) => {
    results.push({ stepNumber, title, passed, details });
    const mark = passed ? "PASS" : "FAIL";
    console.log(`[${mark}] Step ${stepNumber}: ${title}`);
    if (details) {
      console.log(`       Details: ${details}`);
    }
  };

  console.log("==================================================================");
  console.log("       KARAKEEP MANUAL VERIFICATION: AUTH & DASHBOARD             ");
  console.log("==================================================================\n");

  // Step 1: GET /signin
  try {
    const res = await request({ hostname: "localhost", port: 3000, path: "/signin", method: "GET" });
    const hasForm = res.statusCode === 200 && (res.data.includes("Sign In") || res.data.includes("signin"));
    logStep(1, "GET /signin renders sign-in page", hasForm, `Status ${res.statusCode}, HTML length ${res.data.length}`);
  } catch (e) {
    logStep(1, "GET /signin renders sign-in page", false, e.message);
  }

  // Step 2: GET /signup
  try {
    const res = await request({ hostname: "localhost", port: 3000, path: "/signup", method: "GET" });
    const hasForm = res.statusCode === 200 && (res.data.includes("Sign Up") || res.data.includes("Create Your Account"));
    logStep(2, "GET /signup renders registration page", hasForm, `Status ${res.statusCode}, HTML length ${res.data.length}`);
  } catch (e) {
    logStep(2, "GET /signup renders registration page", false, e.message);
  }

  // Step 3: Duplicate user registration validation (no 500 error)
  try {
    const dupBody = JSON.stringify({
      "0": {
        json: {
          name: "Siddharth Gajera",
          email: "gajerasiddharth10@gmail.com",
          password: "TestPassword123!",
          confirmPassword: "TestPassword123!",
        }
      }
    });
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/users.create?batch=1",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, dupBody);
    const parsed = JSON.parse(res.data);
    const errMsg = parsed[0]?.error?.json?.message;
    const isCleanError = res.statusCode === 400 && errMsg === "Email is already taken";
    logStep(3, "Sign Up rejects duplicate email with clear 400 Bad Request", isCleanError, `Status: ${res.statusCode}, Message: "${errMsg}"`);
  } catch (e) {
    logStep(3, "Sign Up rejects duplicate email with clear 400 Bad Request", false, e.message);
  }

  // Step 4: Create new user
  const uniqueEmail = `verify_user_${Date.now()}@example.com`;
  const userPassword = "SecurePassword123!";
  let createdUser = null;
  try {
    const newBody = JSON.stringify({
      "0": {
        json: {
          name: "Verified User",
          email: uniqueEmail,
          password: userPassword,
          confirmPassword: userPassword,
        }
      }
    });
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/users.create?batch=1",
      method: "POST",
      headers: { "Content-Type": "application/json" }
    }, newBody);
    const parsed = JSON.parse(res.data);
    createdUser = parsed[0]?.result?.data?.json;
    const isCreated = res.statusCode === 200 && createdUser && createdUser.email === uniqueEmail;
    logStep(4, "Sign Up creates new user account", isCreated, `Status: ${res.statusCode}, User ID: ${createdUser?.id}, Email: ${createdUser?.email}`);
  } catch (e) {
    logStep(4, "Sign Up creates new user account", false, e.message);
  }

  // Get CSRF Token for Sign In tests
  let csrfToken = "";
  let csrfCookie = "";
  try {
    const res = await request({ hostname: "localhost", port: 3000, path: "/api/auth/csrf", method: "GET" });
    const parsed = JSON.parse(res.data);
    csrfToken = parsed.csrfToken;
    csrfCookie = (res.headers["set-cookie"] || []).map(c => c.split(";")[0]).join("; ");
  } catch (e) {
    console.error("Failed to fetch CSRF token:", e);
  }

  // Step 5: Sign In with wrong password (reject unauthorized)
  try {
    const badBody = new URLSearchParams({
      csrfToken,
      email: uniqueEmail,
      password: "WrongPassword999!",
      json: "true",
    }).toString();
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/callback/credentials",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrfCookie,
      }
    }, badBody);
    const isRejected = res.statusCode === 401;
    logStep(5, "Sign In rejects invalid credentials", isRejected, `Status: ${res.statusCode} (401 Unauthorized expected)`);
  } catch (e) {
    logStep(5, "Sign In rejects invalid credentials", false, e.message);
  }

  // Step 6: Sign In with correct credentials
  let sessionCookies = "";
  try {
    const goodBody = new URLSearchParams({
      csrfToken,
      email: uniqueEmail,
      password: userPassword,
      json: "true",
    }).toString();
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/callback/credentials",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: csrfCookie,
      }
    }, goodBody);
    const setCookies = res.headers["set-cookie"] || [];
    const hasSession = setCookies.some(c => c.includes("next-auth.session-token"));
    sessionCookies = [csrfCookie, ...setCookies.map(c => c.split(";")[0])].filter(Boolean).join("; ");
    logStep(6, "Sign In succeeds and issues session cookie", res.statusCode === 200 && hasSession, `Status: ${res.statusCode}, Session Cookie issued: ${hasSession}`);
  } catch (e) {
    logStep(6, "Sign In succeeds and issues session cookie", false, e.message);
  }

  // Step 7: Unauthenticated Dashboard access is protected
  try {
    const res = await request({ hostname: "localhost", port: 3000, path: "/dashboard/bookmarks", method: "GET" });
    const isRedirect = res.statusCode === 307 || res.statusCode === 302;
    logStep(7, "Dashboard route is protected from unauthenticated access", isRedirect, `Status: ${res.statusCode} (Redirect to ${res.headers.location})`);
  } catch (e) {
    logStep(7, "Dashboard route is protected from unauthenticated access", false, e.message);
  }

  // Step 8: Authenticated Dashboard access loads 200 OK
  try {
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/dashboard/bookmarks",
      method: "GET",
      headers: { Cookie: sessionCookies }
    });
    const isOk = res.statusCode === 200 && res.data.length > 50000;
    logStep(8, "Authenticated Dashboard loads successfully", isOk, `Status: ${res.statusCode}, HTML length: ${res.data.length} bytes`);
  } catch (e) {
    logStep(8, "Authenticated Dashboard loads successfully", false, e.message);
  }

  // Step 9: Create a bookmark inside the Dashboard via tRPC
  let createdBookmarkId = null;
  try {
    const bookmarkPayload = JSON.stringify({
      "0": {
        json: {
          type: "text",
          text: "Verification Bookmark: Testing full dashboard lifecycle",
          title: "Dashboard Verification Test",
          source: "web",
        }
      }
    });
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/bookmarks.createBookmark?batch=1",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookies,
      }
    }, bookmarkPayload);
    const parsed = JSON.parse(res.data);
    const bm = parsed[0]?.result?.data?.json;
    createdBookmarkId = bm?.id;
    const isCreated = res.statusCode === 200 && !!createdBookmarkId;
    logStep(9, "Create Bookmark in Dashboard succeeds", isCreated, `Status: ${res.statusCode}, Bookmark ID: ${createdBookmarkId}, Title: "${bm?.title}"`);
  } catch (e) {
    logStep(9, "Create Bookmark in Dashboard succeeds", false, e.message);
  }

  // Step 10: Fetch Bookmarks in Dashboard
  try {
    const inputParam = encodeURIComponent(JSON.stringify({ "0": { json: {} } }));
    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/trpc/bookmarks.getBookmarks?batch=1&input=${inputParam}`,
      method: "GET",
      headers: { Cookie: sessionCookies }
    });
    const parsed = JSON.parse(res.data);
    const bookmarkList = parsed[0]?.result?.data?.json?.bookmarks || [];
    const foundOurBookmark = bookmarkList.some(b => b.id === createdBookmarkId);
    logStep(10, "Dashboard retrieves and displays created bookmark", res.statusCode === 200 && foundOurBookmark, `Status: ${res.statusCode}, Total user bookmarks: ${bookmarkList.length}, Verified ID: ${createdBookmarkId}`);
  } catch (e) {
    logStep(10, "Dashboard retrieves and displays created bookmark", false, e.message);
  }

  console.log("\n==================================================================");
  const totalPassed = results.filter(r => r.passed).length;
  console.log(`TOTAL RESULTS: ${totalPassed} / ${results.length} PASSED`);
  console.log("==================================================================");
}

runVerification().catch(console.error);
