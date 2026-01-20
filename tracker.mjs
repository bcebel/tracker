import { Server } from "bittorrent-tracker";

const server = new Server({
  udp: false,
  http: true, // Enable HTTP so Heroku's health check passes
  ws: true,
  stats: true,
});

const port = process.env.PORT || 8000;

// CRITICAL: Listen on '0.0.0.0', not 'localhost'
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Neighborhood Tracker is LIVE`);
  console.log(`Listening on port: ${port}`);
});

server.on("error", (err) => console.error("Error:", err.message));
server.on("warning", (err) => console.warn("Warning:", err.message));

// Optional: Log when neighbors connect
server.on("start", (peer) => {
  console.log("Peer joined swarm:", peer.infoHash);
});
