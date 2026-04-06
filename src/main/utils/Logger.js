// src/utils/logger.js
const info = (msg) =>
  console.log(`[${new Date().toLocaleTimeString()}] ℹ️ ${msg}`);
const error = (msg, err) =>
  console.error(`[${new Date().toLocaleTimeString()}] ❌ ${msg}`, err || "");
const success = (msg) =>
  console.log(`[${new Date().toLocaleTimeString()}] ✅ ${msg}`);

module.exports = { info, error, success };
