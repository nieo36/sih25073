const http = require("http");
require('dotenv').config();
const { mongoConnect } = require('./src/config/db.js');
const { user } = require('./src/model/user.model.js');
const app = require('./app.js');

async function testLoginFlow() {
    console.log("Testing Login API Endpoint...");
    await mongoConnect(process.env.MONGO_URI);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const port = server.address().port;

    const testReq = (path, method, body) => {
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
                    },
                },
                (res) => {
                    let resBody = "";
                    res.on("data", (chunk) => (resBody += chunk));
                    res.on("end", () => {
                        try {
                            resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(resBody) });
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

    const testEmail = `logintest_${Date.now()}@example.com`;
    const testPassword = "Password123!";

    console.log("1. Registering test user:", testEmail);
    const regRes = await testReq("/api/v1/auth/register", "POST", {
        email: testEmail,
        password: testPassword,
        name: "Test Athlete",
    });
    console.log("Register status:", regRes.status);
    console.log("Register data:", regRes.data);

    console.log("\n2. Logging in with test user...");
    const loginRes = await testReq("/api/v1/auth/login", "POST", {
        email: testEmail,
        password: testPassword,
    });
    console.log("Login status:", loginRes.status);
    console.log("Login data:", loginRes.data);

    console.log("\n3. Testing login with wrong password...");
    const wrongPassRes = await testReq("/api/v1/auth/login", "POST", {
        email: testEmail,
        password: "WrongPassword123!",
    });
    console.log("Wrong pass status:", wrongPassRes.status);
    console.log("Wrong pass data:", wrongPassRes.data);

    console.log("\n4. Testing login with non-existent email...");
    const wrongEmailRes = await testReq("/api/v1/auth/login", "POST", {
        email: "nonexistent_email_12345@example.com",
        password: "Password123!",
    });
    console.log("Wrong email status:", wrongEmailRes.status);
    console.log("Wrong email data:", wrongEmailRes.data);

    // Clean up
    await user.deleteOne({ email: testEmail });
    server.close();
    process.exit(0);
}

testLoginFlow().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
