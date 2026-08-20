const mongoose = require('mongoose');
require('dotenv').config();

console.log("Connecting to:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
        console.log("MONGO CONNECTED SUCCESSFULLY!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("MONGO CONNECTION FAILED:", err.message);
        process.exit(1);
    });
