const { calculateHash, getRoot } = require("./utils");
const db = require("./db/index.js");
const Block = require("./block.js");
const extendWallet = require("./wallets.json");

function createGenesisBlock() {
  return Block(
    0,
    0,
    "0",
    calculateHash(0, "0", 0, 0),
    "Genesis Block",
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
    proposedBlock.data,
    proposedBlock.timestamp,
    proposedBlock.nonce
  );
  if (proposedBlockHash !== proposedBlock.hash) {
    console.log("Block hash does not match block contents.");
    return false;
  }

  const latestBlock = await getLatestBlock();
  const blockchain = await getBlockChain();

  if (latestBlock.index + 1 != proposedBlock.index) {
    console.log("Block height is incorrect.");
    return false;
  }

  if (blockchain.difficulty != proposedBlock.difficulty) {
    console.log("Block difficulty does not match latest block.");
    return false;
  }
  // Check if the block hash meets the difficulty requirement
  if (BigInt("0x" + proposedBlock.hash) >= BigInt(proposedBlock.difficulty)) {
    console.log("Block hash does not meet difficulty requirements.");
    return false;
  }

  // Check if the previous hash matches the hash of the latest block on the chain
  if (proposedBlock.previousHash !== latestBlock.hash) {
    console.log("Previous hash does not match hash of the latest block.");
    return false;
  }

  const data = proposedBlock?.data;
  if (data.length == 0) {
    console.log("Block data is incorrect.");
    return false;
  }

  const last = data[data.length - 1];

  const miningReward = blockchain["miningReward"];

  const coinbase = last?.coinbase;
  const amount = last?.amount;
  // Check if the block height is correct
  if (!coinbase) {
    console.log("Block height is incorrect.");
    return false;
  }
  // Check if the block height is correct
  if (amount != miningReward) {
    console.log("Block height is incorrect.");
    return false;
  }
  // All checks passed
  return true;
}

async function getLatestBlock() {
  const blocks = await db.find("blocks", {});

  return blocks[blocks.length - 1];
}

async function getRecentBlocks(n) {
  const blocks = await db.find("blocks", {});
  if (blocks.length <= n) {
    return blocks.slice(1); // Exclude genesis block
  } else {
    return blocks.slice(-n); // Get last n blocks
  }
}

async function getAverageMineTime(blocks) {
  let total = 0;

  for (let i = 1; i < blocks.length; i++) {
    total += blocks[i].timestamp - blocks[i - 1].timestamp;
  }
  for (let i = 1; i < blocks.length; i++) {
    total += blocks[i].timestamp - blocks[i - 1].timestamp;
  }

  return total / (blocks.length - 1);
}

async function adjustDifficulty(block) {
  const blockchain = await getBlockChain();
  const targetMineTime = blockchain.targetMineTime;

  const latestBlock = await getLatestBlock();

  const difficulty = latestBlock.difficulty;

  const avgMineTime =
    block.actualTimestamp - (latestBlock.actualTimestamp || 0);
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
  const genesis = createGenesisBlock();
  const blockchain = await db.find("blockchain", {});
  if (blockchain.length == 0) {
    await db.insert("blockchain", [
      {
        name: "particles",
        miningReward: 50,
        targetMineTime: 1000,
        difficulty: genesis.difficulty,
      },
    ]);
    const wallets = extendWallet.map((item) => {
      item["balance"] = Number(item["balance"]);
      return item;
    });
    await db.insert("wallets", wallets);

    const stateRoot = getRoot(wallets);
    genesis["stateRoot"] = stateRoot;
    await db.insert("blocks", [genesis]);
  }
}

async function mineBlock(proposedBlock) {
  const valid = await isValidBlock(proposedBlock);

  if (valid) {
    const data = proposedBlock?.data;
    if (!data) {
      return false;
    }
    const last = data[data.length - 1];

    const coinbase = last?.coinbase;
    const amount = last?.amount;

    const wallet = await getBalanceOfAddress(coinbase);
    if (wallet.address) {
      await db.update(
        "wallets",
        { address: coinbase },
        { $inc: { balance: amount } }
      );
    } else {
      await db.insert("wallets", [
        {
          address: coinbase,
          balance: amount,
        },
      ]);
    }
    const wallets = await getWallets();
    const stateRoot = getRoot(wallets);
    proposedBlock["stateRoot"] = stateRoot;
    proposedBlock["actualTimestamp"] = Date.now();
    await db.insert("blocks", [proposedBlock]);
    console.log(
      "Block accepted. New block hash: " +
        proposedBlock.hash +
        " height: " +
        proposedBlock.index +
        " coinbase: " +
        proposedBlock.data[0]?.coinbase
    );
    await adjustDifficulty(proposedBlock);
    return true;
  } else {
    return false;
  }
}

async function getBalanceOfAddress(address) {
  const wallets = await db.find("wallets", { address: address });

  return wallets?.[0] || {};
}

async function miningInfo() {
  const blockchain = await getBlockChain();
  const latestBlock = await getLatestBlock();
  const wallets = await db.find("wallets", {});
  const pendingTransactions = await db.find("pendingTransactions", {});
  return {
    blockchain,
    latestBlock,
    minersSize: wallets.length,
    pendingTransactions: pendingTransactions,
  };
}

async function sync() {}

async function getWallets() {
  return await db.find("wallets", {});
}

async function blocks(index) {
  const blocks = await db.find("blocks", { index });
  return blocks?.[0] || {};
}

module.exports = {
  Block,
  createGenesisBlock,
  isValidBlock,
  getLatestBlock,
  adjustDifficulty,
  init,
  mineBlock,
  getBalanceOfAddress,
  miningInfo,
  sync,
  getWallets,
  blocks,
};
