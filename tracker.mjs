import { Server } from "bittorrent-tracker";
import http from "http";

const PORT = process.env.PORT || 8000;

const server = new Server({
  udp: false,
  http: true,
  ws: true,
  stats: true,
});

let cachedStats = null;
let lastStatsTime = 0;

const httpServer = http.createServer((req, res) => {
  // Simple router for Heroku Health Checks
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Neighborhood Tracker: ONLINE");
} else if (req.url === "/stats") {
  res.writeHead(200, { "Content-Type": "application/json" });
  
  // Only compute stats once every 5 seconds to avoid timeout
  const now = Date.now();
  if (!cachedStats || now - lastStatsTime > 5000) {
    try {
      const rawStats = server.stats();
      cachedStats = {
        torrents: Object.keys(rawStats.torrents).length,
        peers: Object.keys(rawStats.peers).length,
      };
      lastStatsTime = now;
    } catch (e) {
      res.end(JSON.stringify({ error: "Stats temporarily unavailable" }));
      return;
    }
  }

  res.end(JSON.stringify(cachedStats));
  } else {
    // Forward all other traffic to the tracker
    server.onHttpRequest(req, res);
  }
});

// Crucial for WebSockets on Heroku
httpServer.on("upgrade", (req, socket, head) => {
  if (server.ws) {
    server.ws.handleUpgrade(req, socket, head, (ws) => {
      server.ws.emit("connection", ws, req);
    });
  }
});

// Final error trap to prevent H10 crashes from tiny bugs
process.on("uncaughtException", (err) => {
  console.error("Critical Error trapped:", err.stack);
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Tracker active on port ${PORT}`);
});

// Logging peer activity
server.on("start", (peer) => console.log(`Peer joined: ${peer.infoHash}`));
server.on("error", (err) => console.error(`Tracker Error: ${err.message}`));
