import { Server } from "bittorrent-tracker";
import http from "http";

const PORT = process.env.PORT || 8000;
const APP_URL = "https://tracker-0ad4cca9fd92.herokuapp.com";

const server = new Server({
  udp: false, // Heroku doesn't support UDP
  http: true,
  ws: true,
  stats: true,
});

// 1. Create a single HTTP server to handle everything
const httpServer = http.createServer((req, res) => {
  // Handle Health Check & Stats
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Neighborhood Tracker is Running");
  } else if (req.url === "/stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(server.stats()));
  } else {
    // Let the tracker handle other HTTP requests (like /announce)
    server.onHttpRequest(req, res);
  }
});

// 2. IMPORTANT: Manually handle the WebSocket upgrade for Heroku
httpServer.on("upgrade", (req, socket, head) => {
  if (server.ws) {
    server.ws.handleUpgrade(req, socket, head, (ws) => {
      server.ws.emit("connection", ws, req);
    });
  }
});

// 3. Attach and Listen (Only call listen once!)
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Neighborhood Tracker is LIVE on port ${PORT}`);
});

// 4. Keep-Alive: Ping itself every 20 minutes
setInterval(
  () => {
    console.log("⚓ Keeping tracker awake...");
    http
      .get(APP_URL, (res) => {
        console.log(`Keep-alive status: ${res.statusCode}`);
      })
      .on("error", (err) => {
        console.error("Keep-alive failed:", err.message);
      });
  },
  1000 * 60 * 20,
);

// Error Handling
server.on("error", (err) => console.error("Tracker Error:", err.message));
server.on("start", (peer) => console.log("Peer joined:", peer.infoHash));
