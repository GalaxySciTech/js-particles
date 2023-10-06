const blockchain = require("./blockchain");
const lock = require("./lock");
const fastify = require("fastify")();
const cors = require("@fastify/cors");
fastify.register(cors);
// Blockchain and Block class (as defined earlier)
// ...

fastify.setErrorHandler((error, request, reply) => {
  return { status: 0, result: error?.message };
});

fastify.post("/add-transaction", async (request, reply) => {
  const transaction = request.body;
  await lock("addTransaction", blockchain.addTransaction, transaction);
  return { status: 1, result: "success" };
});

fastify.post("/submit-block", async (request, reply) => {
  const proposedBlock = request.body;

  await lock("submitBlock", blockchain.mineBlock, proposedBlock);
  return { status: 1, result: "success" };
});

fastify.post("/add-trasaction", async (request, reply) => {
  const trasaction = request.body;
  await blockchain.addTransaction(trasaction);
  return { status: 1, result: "success" };
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
  const wallets = await blockchain.getWallets();
  return wallets;
});

fastify.get("/get-blocks", async (request, reply) => {
  const index = parseInt(request.query.index);
  const blocks = await blockchain.blocks(index);
  return blocks;
});

module.exports = fastify;
