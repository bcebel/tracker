// tracker.js
import { Server } from "bittorrent-tracker";

const server = new Server({
  udp: false, // Browsers can't use UDP
  http: false, // Browsers can't use HTTP trackers easily
  ws: true, // THIS is the only one that matters for WebTorrent
  stats: true, // Keep this so you can see if it's working
  // REMOVED: the 'filter' function so ALL your neighborhood torrents are allowed
});

server.on("error", (err) => console.log("❌ Tracker Error:", err.message));
server.on("warning", (err) => console.log("⚠️ Tracker Warning:", err.message));

server.on("listening", () => {
  const wsAddr = server.ws.address();
  console.log(
    `🚀 Neighborhood WebSocket Tracker: ws://localhost:${wsAddr.port}`,
  );
});

// STARTING THE SERVER
// Use a fixed port (like 8000) so you don't have to change your app code every time
const port = 8000;
server.listen(port, "0.0.0.0");

// Simple logging to see neighbors connecting
server.on("start", (addr) => {
  console.log("✨ Neighbor joined swarm:", addr);
});