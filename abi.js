const { getAccounts, getBalance } = require("./accounts");
const {
  getBlockChain,
  getLatestBlock,
  mineBlock,
  addTransaction,
  getBlock,
} = require("./blockchain");
const { minerAddress } = require("./config");
const db = require("./db");
const lock = require("./lock");
const fastify = require("fastify")();
const cors = require("@fastify/cors");
fastify.register(cors);
// Blockchain and Block class (as defined earlier)
// ...

fastify.setErrorHandler((error, request, reply) => {
  console.error(error?.message);
  return { status: 0, result: error?.message };
});

fastify.post("/addTransaction", async (request, reply) => {
  const transaction = request.body;
  await lock("addTransaction", addTransaction, transaction);
  return { status: 1, result: "success" };
});

fastify.post("/submitBlock", async (request, reply) => {
  const proposedBlock = request.body;

  await lock("submitBlock", mineBlock, proposedBlock);
  return { status: 1, result: "success" };
});

fastify.get("/getMiningInfo", async (request, reply) => {
  const blockchain = await getBlockChain();
  const latestBlock = await getLatestBlock();
  const accounts = await getAccounts();
  const pendingTransactions = await db.find("pendingTransactions", {});
  return {
    blockchain,
    latestBlock,
    minersSize: accounts.length,
    pendingTransactions: pendingTransactions,
    coinbaseTx: {
      amount: blockchain.miningReward,
      from: minerAddress,
      opcode: "coinbase",
    },
  };
});

fastify.get("/getBalance", async (request, reply) => {
  const address = request.query.address;

  const wallet = await getBalance(address);
  return wallet;
});

fastify.get("/getMiners", async (request, reply) => {
  const accounts = await getAccounts();
  return accounts;
});

fastify.get("/getBlock", async (request, reply) => {
  const index = parseInt(request.query.index);
  const blocks = await getBlock(index);
  return blocks;
});

module.exports = fastify;
