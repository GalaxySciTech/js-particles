const {
  calculateHash,
  isAddress,
  recoveryFromSig,
  isPositiveInteger,
  createMsgFromTransaction,
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
const { exec, coinbase, isOpcode } = require("./vm");

function createGenesisBlock() {
  const block = Block(
    0,
    0,
    "0",
    "",
    [
      {
        data: "e69c95e7bb9fe585ade59bbdefbc8ce5a4a9e4b88be5bd92e4b880efbc8ce7ad91e995bfe59f8eefbc8ce4b880e99587e4b99de5b79ee9be99e88489efbc8ce58dabe68891e5a4a7e7a7a6efbc8ce68aa4e68891e7a4bee7a8b7e38082e69c95e4bba5e5a78be79a87e4b98be5908de59ca8e6ada4e7ab8be8aa93efbc8ce69c95e59ca8e5bd93e5ae88e59c9fe5bc80e79686efbc8ce689abe5b9b3e59b9be5a4b7efbc8ce5ae9ae68891e5a4a7e7a7a6e4b887e4b896e4b98be59fbaefbc8ce69c95e4baa1efbc8ce4baa6e5b086e8baabe58c96e9be99e9ad82efbc8ce4bd91e68891e58d8ee5a48fefbc8ce6b0b8e4b896e4b88de8a1b0e38082",
      },
    ],
    0,
    Number("0x0000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
  );
  block.hash = calculateHash(block);
  return block;
}

async function getBlockChain() {
  const blockchain = await db.find("blockchain", {});
  return blockchain[0];
}

async function isValidBlock(proposedBlock) {
  // Check if the block's hash matches its contents
  const temp = { ...proposedBlock };
  temp.hash = "";
  const proposedBlockHash = calculateHash(temp);
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

  const from = first?.from;
  const amount = first?.amount;

  if (!isAddress(from)) {
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
    await coinbase(first.from, first.amount);
  } else {
    throw Error("Block data is incorrect. missing coinbase");
  }
  if (data.length > 1) {
    for (i = 1; i < data.length; i++) {
      await exec(data[i]);
    }
  }

  if (proposedBlock.index % 10 == 0) {
    await adjustDifficulty();
  }

  proposedBlock["stateRoot"] = await getStateRoot();

  await db.insert("blocks", [proposedBlock]);
  console.log("Block accepted.", JSON.stringify(proposedBlock));
}

async function addTransaction(transaction) {
  const temp = { ...transaction };
  temp.hash = "";
  const hash = calculateHash(temp);
  if (hash != transaction.hash) {
    throw Error("Invalid transaction hash");
  }

  const from = recoveryFromSig(transaction.sig);
  if (from != transaction.from) {
    throw Error("Invalid signature");
  }

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
