const crypto = require("crypto");

function calculateHash(index, previousHash, data, timestamp, nonce) {
  return crypto
    .createHash("sha256")
    .update(index + previousHash + timestamp + JSON.stringify(data) + nonce)
    .digest("hex");
}
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

module.exports = {
  calculateHash,
  sleep,
};
