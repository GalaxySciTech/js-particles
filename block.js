function block(index, timestamp, previousHash, hash, data, nonce, difficulty) {
  return { index, timestamp, previousHash, hash, data, nonce, difficulty };
}

module.exports = block;
