const assert = require("assert");
const { registerSchema, loginSchema } = require("./src/controller/auth/auth.schema.js");
const { hashPassword, compareHash } = require("./src/utils/hash.js");
const { createAccessToken, createRefreshToken, verifyAccessToken, verifyRefreshToken } = require("./src/utils/token.js");
const app = require("./app.js");

process.env.JWT_ACCESS_SECRET = "test_access_secret_123456789";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret_123456789";
process.env.JWT_EMAIL_SECRET = "test_email_secret_123456789";

async function runTests() {
    console.log("=========================================");
    console.log("RUNNING AUTH BACKEND UNIT & LOGIC TESTS");
    console.log("=========================================\n");

    // 1. Schema Validation Tests
    console.log("1. Testing Zod Schemas...");
    const validRegister = registerSchema.safeParse({
        email: "athlete@example.com",
        password: "securePassword123",
        name: "Usain Bolt",
    });
    assert.strictEqual(validRegister.success, true, "Valid register schema should pass");

    const invalidRegister = registerSchema.safeParse({
        email: "not-an-email",
        password: "123",
        name: "A",
    });
    assert.strictEqual(invalidRegister.success, false, "Invalid register schema should fail");

    const validLogin = loginSchema.safeParse({
        email: "athlete@example.com",
        password: "securePassword123",
    });
    assert.strictEqual(validLogin.success, true, "Valid login schema should pass");
    console.log("   [PASS] Schema validation tests passed!\n");

    // 2. Hash Utility Tests
    console.log("2. Testing Password Hashing & Comparison...");
    const rawPass = "MySuperSecretPassword@2026";
    const hashed = await hashPassword(rawPass);
    assert.ok(hashed && hashed.startsWith("$2"), "Password should be bcrypt hashed");
    const match = await compareHash(rawPass, hashed);
    assert.strictEqual(match, true, "Password comparison should return true for matching password");
    const wrongMatch = await compareHash("WrongPass", hashed);
    assert.strictEqual(wrongMatch, false, "Password comparison should return false for incorrect password");
    console.log("   [PASS] Password hashing & comparison passed!\n");

    // 3. JWT Token Tests
    console.log("3. Testing JWT Access & Refresh Tokens...");
    const userId = "64f1a2b3c4d5e6f7a8b9c0d1";
    const role = "user";
    const tokenVersion = 1;

    const accessToken = await createAccessToken(userId, role, tokenVersion);
    assert.ok(accessToken, "Access token should be generated");
    const decodedAccess = await verifyAccessToken(accessToken);
    assert.strictEqual(decodedAccess.sub, userId, "Decoded access token sub matches");
    assert.strictEqual(decodedAccess.role, role, "Decoded access token role matches");
    assert.strictEqual(decodedAccess.tokenVersion, tokenVersion, "Decoded access token version matches");

    const refreshToken = await createRefreshToken(userId, tokenVersion);
    assert.ok(refreshToken, "Refresh token should be generated");
    const decodedRefresh = await verifyRefreshToken(refreshToken);
    assert.strictEqual(decodedRefresh.sub, userId, "Decoded refresh token sub matches");
    assert.strictEqual(decodedRefresh.tokenVersion, tokenVersion, "Decoded refresh token version matches");
    console.log("   [PASS] JWT token creation and verification passed!\n");

    // 4. Testing Express Route Mounting
    console.log("4. Testing Express App & Router Mounting...");
    assert.ok(app, "Express app loaded successfully");
    
    // Test that the app can handle simulated HTTP requests
    const http = require("http");
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;

    // Test POST /api/v1/auth/register with bad payload
    const testReq = (path, method, body, headers = {}) => {
        return new Promise((resolve, reject) => {
            const data = body ? JSON.stringify(body) : "";
            const req = http.request(
                {
                    hostname: "127.0.0.1",
                    port: port,
                    path: path,
                    method: method,
                    headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(data),
                        ...headers,
                    },
                },
                (res) => {
                    let resBody = "";
                    res.on("data", (chunk) => (resBody += chunk));
                    res.on("end", () => {
                        try {
                            resolve({ status: res.statusCode, data: JSON.parse(resBody) });
                        } catch (e) {
                            resolve({ status: res.statusCode, raw: resBody });
                        }
                    });
                }
            );
            req.on("error", reject);
            if (data) req.write(data);
            req.end();
        });
    };

    const badRegisterRes = await testReq("/api/v1/auth/register", "POST", { email: "bad" });
    assert.strictEqual(badRegisterRes.status, 400, "Should return 400 for invalid registration body");
    console.log("   [PASS] POST /api/v1/auth/register rejected invalid body with 400 as expected");

    const badLoginRes = await testReq("/api/v1/auth/login", "POST", { email: "bad" });
    assert.strictEqual(badLoginRes.status, 400, "Should return 400 for invalid login body");
    console.log("   [PASS] POST /api/v1/auth/login rejected invalid body with 400 as expected");

    const unauth2faRes = await testReq("/api/v1/auth/2fa/setup", "POST", {});
    assert.strictEqual(unauth2faRes.status, 401, "Should return 401 Unauthorized when no Bearer token provided");
    console.log("   [PASS] POST /api/v1/auth/2fa/setup protected by requireAuth middleware");

    server.close();
    console.log("\n=========================================");
    console.log("ALL BACKEND CHECKS & TESTS PASSED (100%)");
    console.log("=========================================");
    process.exit(0);
}

runTests().catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
});
