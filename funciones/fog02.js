const http = require("http");

const NODE_NAME = process.env.NODE_NAME || "unknown";

const server = http.createServer((req, res) => {
  if (req.method !== "POST") {
    res.writeHead(405);
    return res.end("Method Not Allowed");
  }

  let body = "";

  req.on("data", chunk => (body += chunk));
  req.on("end", () => {
    const event = body ? JSON.parse(body) : {};

    console.log("=== FOG 02 POD ===");
    console.log("Nodo:", NODE_NAME);
    console.log("Evento:", event);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        fogNode: NODE_NAME,
        received: event,
      })
    );
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log(`Fog02 listening on 0.0.0.0:3000 (${NODE_NAME})`);
});