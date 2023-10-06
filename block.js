function block(
  index,
  timestamp,
  previousHash,
  hash,
  transactions,
  nonce,
  difficulty
) {
  return {
    index,
    timestamp,
    previousHash,
    hash,
    transactions,
    nonce,
    difficulty,
  };
}

module.exports = block;
