const http = require('http');
require('dotenv').config();
const { mongoConnect } = require('./src/config/db.js');
const app = require('./app.js');

const port = Number(process.env.PORT) || 2000;
const mongo = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/geotager";
const host = process.env.HOST ?? "0.0.0.0";

async function start() {
    if (mongo) {
        await mongoConnect(mongo);
    }
    const server = http.createServer(app);
    server.listen(port, host, () => {
        console.log(`Server ${host} Listening on ${port}`);
    });
}

start();
