import { Server } from "bittorrent-tracker";
import http from "http";

const server = new Server({
  udp: false,
  http: true, // Required for Heroku health checks
  ws: true,
  stats: true,
});

const PORT = process.env.PORT || 8000;
const httpServer = http.createServer((req, res) => {
  // HEROKU HEALTH CHECK & BROWSER PING
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Neighborhood Tracker is Running");
    return;
  }

  // STATS CHECK (Optional: visit /stats in browser)
  if (req.url === "/stats") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(server.stats()));
    return;
  }
});

// Pass the http server to the tracker
server.http = httpServer;

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Neighborhood Tracker is LIVE on port ${PORT}`);
});

const APP_URL = "https://tracker-0ad4cca9fd92.herokuapp.com";

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Neighborhood Tracker is LIVE on port ${PORT}`);

  // Keep-Alive: Ping itself every 20 minutes
  setInterval(
    () => {
      console.log("⚓ Keeping tracker awake...");
      http
        .get(APP_URL, (res) => {
          console.log(`Response: ${res.statusCode}`);
        })
        .on("error", (err) => {
          console.error("Keep-alive failed:", err.message);
        });
    },
    1000 * 60 * 20,
  ); // 20 minutes
});

// Standard logging
server.on("error", (err) => console.error("Error:", err.message));
server.on("start", (peer) => console.log("Peer joined:", peer.infoHash));
