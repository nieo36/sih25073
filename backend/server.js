const http = require('http');
require('dotenv').config();
const app = require('./app.js');
const server = http.createServer(app);

server.listen(process.env.PORT ?? 2000, process.env.HOST ?? "0.0.0.0", () => {
    console.log("Server Listening on", `${process.env.HOST}:${process.env.PORT}`);
})