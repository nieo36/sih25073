const mongoose = require("mongoose");
const dns = require("dns");

try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
} catch (e) {
    console.warn("Could not override DNS servers:", e.message);
}

mongoose.connection.once("open", () => {
    console.log("MongoDb connected successfully");
});

mongoose.connection.on("error", (err) => {
    console.log("MongoDb error:", err);
});

async function mongoConnect(mongo) {
    try {
        await mongoose.connect(mongo);
    } catch (err) {
        console.error("MongoDB initial connection error:", err);
    }
}

module.exports = { mongoConnect };
