// src/utils/logger.js

// Função auxiliar para formatar o prefixo comum
const getPrefix = (inTransition) => {
  const time = new Date().toLocaleTimeString();
  // Se estiver em transição, adiciona um indicador [TR] ou um emoji, caso contrário fica vazio
  const transitionBadge = inTransition ? "⏳ [Em Transição] " : "";
  return `[${time}] ${transitionBadge}`;
};

const info = (msg, inTransition = false) =>
  console.log(`${getPrefix(inTransition)}ℹ️ ${msg}`);

const error = (msg, err, inTransition = false) =>
  console.error(`${getPrefix(inTransition)}❌ ${msg}`, err || "");

const success = (msg, inTransition = false) =>
  console.log(`${getPrefix(inTransition)}✅ ${msg}`);

module.exports = { info, error, success };