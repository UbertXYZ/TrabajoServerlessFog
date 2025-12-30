const http = require("http");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const CLOUD_URL = process.env.CLOUD_URL;

http.createServer(async (req, res) => {
  if (req.method !== "POST") return res.end("Only POST");
  console.log("=== FOG 01 POD ===");
  let body = "";
  req.on("data", c => (body += c));
  req.on("end", async () => {
    const cloud = await fetch(CLOUD_URL, {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
    });
    const data = await cloud.json();
    res.end(JSON.stringify(data));
  });
}).listen(3000, "0.0.0.0", () => {
  console.log("Fog01 listening on 0.0.0.0:3000");
});