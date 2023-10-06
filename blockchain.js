const {
  calculateHash,
  isAddress,
  recoveryFromSig,
  isPositiveInteger,
} = require("./utils");
const db = require("./db");
const Block = require("./block");

const { config } = require("dotenv");
const { minerAddress } = require("./config");
const {
  changeBalance,
  getStateRoot,
  initAccounts,
  getBalance,
} = require("./accounts");
const { exec, coinbase } = require("./vm");

function createGenesisBlock() {
  return Block(
    0,
    0,
    "0",
    calculateHash(0, "0", 0, 0),
    [
      {
        data: "朕统六国，天下归一",
      },
    ],
    0,
    Number("0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
  );
}

async function getBlockChain() {
  const blockchain = await db.find("blockchain", {});
  return blockchain[0];
}

async function isValidBlock(proposedBlock) {
  // Check if the block's hash matches its contents
  const proposedBlockHash = calculateHash(
    proposedBlock.index,
    proposedBlock.previousHash,
    proposedBlock.transactions,
    proposedBlock.timestamp,
    proposedBlock.nonce
  );
  if (proposedBlockHash !== proposedBlock.hash) {
    throw Error("Block hash does not match block contents.");
  }

  const latestBlock = await getLatestBlock();
  const blockchain = await getBlockChain();

  if (
    latestBlock.timestamp > proposedBlock.timestamp &&
    proposedBlock.timestamp < Date.now()
  ) {
    throw Error("Block timestamp is incorrect.");
  }

  if (latestBlock.index + 1 != proposedBlock.index) {
    throw Error("Block height is incorrect.");
  }

  if (blockchain.difficulty != proposedBlock.difficulty) {
    throw Error("Block difficulty does not match latest block.");
  }
  // Check if the block hash meets the difficulty requirement
  if (BigInt("0x" + proposedBlock.hash) >= BigInt(proposedBlock.difficulty)) {
    throw Error("Block hash does not meet difficulty requirements.");
  }

  // Check if the previous hash matches the hash of the latest block on the chain
  if (proposedBlock.previousHash !== latestBlock.hash) {
    throw Error("Previous hash does not match hash of the latest block.");
  }

  const data = proposedBlock?.transactions;
  if (data.length == 0) {
    throw Error("Block data is incorrect.");
  }

  const first = data[0];

  const miningReward = blockchain["miningReward"];

  const coinbase = first?.coinbase;
  const amount = first?.amount;

  if (!isAddress(coinbase)) {
    throw Error("Coinbase address is incorrect.");
  }

  if (amount != miningReward) {
    throw Error("Coinbase amount is incorrect.");
  }
  // All checks passed
  return true;
}

async function getBlocks(limit) {
  const blocks = await db.find(
    "blocks",
    {},
    { sort: { timestamp: -1 }, limit }
  );
  return blocks;
}

async function getLatestBlock() {
  const blocks = await getBlocks(1);

  return blocks?.[0];
}

async function getAvgTime(blocks) {
  if (blocks.length < 2) {
    return Date.now() - blocks?.[0].timestamp;
  }

  let totalDifference = 0;

  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].index != 0) {
      const difference = blocks[i].timestamp - blocks[i - 1].timestamp;
      totalDifference += difference;
    }
  }

  const averageDifference = Math.abs(
    Math.floor(totalDifference / (blocks.length - 1))
  );

  return averageDifference;
}

async function adjustDifficulty() {
  const blockchain = await getBlockChain();
  const targetMineTime = blockchain.targetMineTime;
  const difficulty = blockchain.difficulty;

  const blocks = await getBlocks(10);
  const avgMineTime = await getAvgTime(blocks);

  console.log("last 10 blocks avg time", avgMineTime);

  const changeDifficulty = Math.floor(difficulty * 0.1);

  if (avgMineTime < targetMineTime) {
    await db.update(
      "blockchain",
      {},
      { $inc: { difficulty: -changeDifficulty } }
    );
  } else if (
    difficulty + changeDifficulty <
    Number("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
  ) {
    // Ensure difficulty never drops below 1
    await db.update(
      "blockchain",
      {},
      { $inc: { difficulty: changeDifficulty } }
    );
  }
}

async function init() {
  const blockchain = await db.find("blockchain", {});
  if (blockchain.length == 0) {
    await initAccounts();
    const genesis = createGenesisBlock();
    genesis["stateRoot"] = await getStateRoot();
    await db.insert("blocks", [genesis]);
    await db.insert("blockchain", [
      {
        name: "particles",
        miningReward: 5e19,
        targetMineTime: 5000,
        difficulty: genesis.difficulty,
      },
    ]);
  }
}

async function mineBlock(proposedBlock) {
  await isValidBlock(proposedBlock);

  const data = proposedBlock?.transactions;
  if (!data) {
    throw Error("Block data is incorrect.");
  }

  const first = data[0];

  if (first.opcode == "coinbase") {
    await coinbase(first.coinbase, first.amount);
  } else {
    throw Error("Block data is incorrect. missing coinbase");
  }
  if (data.length > 1) {
    for (i = 1; i < data.length; i++) {
      exec(data[i]);
    }
  }

  if (proposedBlock.index % 10 == 0) {
    await adjustDifficulty();
  }

  proposedBlock["stateRoot"] = await getStateRoot();

  await db.insert("blocks", [proposedBlock]);
  console.log(
    "Block accepted. New block hash: " +
      proposedBlock.hash +
      " height: " +
      proposedBlock.index +
      " coinbase: " +
      proposedBlock.transactions[0]?.coinbase
  );
}

async function addTransaction(transaction) {
  const from = recoveryFromSig(transaction.sig);

  const account = await getBalance(from);
  if (!account.address) {
    throw Error("Invalid from address");
  }
  const balance = account.balance;
  if (!isOpcode(transaction.opcode)) {
    throw Error("Invalid opcode");
  }
  if (!isPositiveInteger(transaction.amount)) {
    throw Error("Invalid amount");
  }
  if (balance < transaction.amount) {
    throw Error("Insufficient balance");
  }
  if (!isAddress(transaction.to)) {
    throw Error("Invalid to address");
  }
  transaction["from"] = account.address;
  await db.insert("pendingTransactions", [transaction]);
  console.log("receive transaction", transaction);
}

async function getBlock(index) {
  const blocks = await db.find("blocks", { index });
  return blocks?.[0] || {};
}

module.exports = {
  getBlockChain,
  Block,
  createGenesisBlock,
  isValidBlock,
  getLatestBlock,
  adjustDifficulty,
  init,
  mineBlock,
  getBlock,
  addTransaction,
};
