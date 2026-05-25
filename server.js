const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// Service Worker must be served from root with correct headers
app.get("/sw.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.sendFile(path.join(__dirname, "public", "sw.js"));
});

// Manifest
app.get("/manifest.json", (req, res) => {
  res.setHeader("Content-Type", "application/manifest+json");
  res.sendFile(path.join(__dirname, "public", "manifest.json"));
});

// SPA fallback — serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n✅ Todo PWA is running!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`\n   Service Worker requires HTTPS in production.`);
  console.log(`   For localhost testing it works without HTTPS.\n`);
});
