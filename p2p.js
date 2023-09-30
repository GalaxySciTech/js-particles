const { Blockchain } = require("./blockchain");

const fastify = require("fastify")();

// Blockchain and Block class (as defined earlier)
// ...
const miners = new Set();
const coin = new Blockchain();

fastify.post("/submit-block", async (request, reply) => {
  const proposedBlock = request.body;

  const success = coin.mineBlock(proposedBlock);

  if (success) {
    return { result: "Block accepted. Thank you for mining!" };
  } else {
    return { result: "Block rejected. Invalid solution." };
  }
});

fastify.get("/get-mining-info", async (request, reply) => {
  return {
    minersSize: miners.size,
    difficulty: coin.difficulty,
    latestBlock: coin.getLatestBlock(),
    adjustDifficultyBlocks: coin.adjustDifficultyBlocks,
    miningReward: coin.miningReward,
    pendingTransactions: coin.pendingTransactions,
  };
});

fastify.get("/get-balance", async (request, reply) => {
  const address = request.query.address;
  const wallet = coin.getBalanceOfAddress(address);
  return wallet;
});

module.exports = fastify;
