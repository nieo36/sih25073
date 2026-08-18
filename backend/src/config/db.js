const mongoose = require("mongoose");

mongoose.connection.once("open", () => {
    console.log("MongoDb connected");
});

mongoose.connection.on("error", (err) => {
    console.log("MongoDb error:", err);
});

async function mongoConnect(mongo) {
    try {
        await mongoose.connect(mongo);
    } catch (err) {
        console.log(err);
    }
}

module.exports = { mongoConnect };
