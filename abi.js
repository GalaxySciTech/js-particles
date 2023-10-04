const blockchain = require("./blockchain");
const lock = require("./lock");
const fastify = require("fastify")();
const cors = require("@fastify/cors");
fastify.register(cors);
// Blockchain and Block class (as defined earlier)
// ...

fastify.post("/submit-block", async (request, reply) => {
  const proposedBlock = request.body;

  const success = await lock(
    "submitBlock",
    blockchain.mineBlock,
    proposedBlock
  );
  if (success) {
    return { result: "Block accepted. Thank you for mining!" };
  } else {
    return { result: "Block rejected. Invalid solution." };
  }
});

fastify.get("/get-mining-info", async (request, reply) => {
  const info = await blockchain.miningInfo();
  return info;
});

fastify.get("/get-balance", async (request, reply) => {
  const address = request.query.address;
  const wallet = await blockchain.getBalanceOfAddress(address);
  return wallet;
});

fastify.get("/get-miners", async (request, reply) => {
  const wallets = await blockchain.wallets();
  return wallets;
});

fastify.get("/get-blockchain", async (request, reply) => {
  const blockchain = await blockchain.blockchain();
  return blockchain;
});

fastify.get("/get-blocks", async (request, reply) => {
  const index = parseInt(request.query.index);
  const blocks = await blockchain.blocks(index);
  return blocks;
});

module.exports = fastify;
