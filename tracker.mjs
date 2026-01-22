import { Server } from "bittorrent-tracker";
import http from "http";

const PORT = process.env.PORT || 8000;
const APP_URL = "https://tracker-0ad4cca9fd92.herokuapp.com";

const server = new Server({
  udp: false,
  http: true,
  ws: true,
  stats: true,
});

const httpServer = http.createServer((req, res) => {
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Neighborhood Tracker is Running");
  } else if (req.url === "/stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(server.stats()));
  } else {
    // Correct way to pass requests to the tracker
    server.onHttpRequest(req, res);
  }
});

// Handle the WebSocket upgrade for Heroku
httpServer.on("upgrade", (req, socket, head) => {
  if (server.ws) {
    server.ws.handleUpgrade(req, socket, head, (ws) => {
      server.ws.emit("connection", ws, req);
    });
  }
});

// Fix: Use backticks for the template literal here
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Neighborhood Tracker is LIVE on port ${PORT}`);
});

// Keep-Alive Ping
setInterval(
  () => {
    console.log("⚓ Keeping tracker awake...");
    http
      .get(APP_URL, (res) => {
        // Fix: Use backticks for the template literal here
        console.log(`Keep-alive status: ${res.statusCode}`);
      })
      .on("error", (err) => {
        console.error("Keep-alive failed:", err.message);
      });
  },
  1000 * 60 * 20,
);

server.on("error", (err) => console.error("Tracker Error:", err.message));
server.on("start", (peer) => console.log("Peer joined:", peer.infoHash));
