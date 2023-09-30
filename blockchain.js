const { calculateHash } = require("./utils");
const fs = require("fs").promises;

class Block {
  constructor(index, timestamp, previousHash, hash, data, nonce, difficulty) {
    this.index = index; // block height
    this.timestamp = timestamp;
    this.previousHash = previousHash;
    this.hash = hash;
    this.data = data;
    this.nonce = nonce;
    this.difficulty = difficulty;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 1;
    this.miningReward = 50;
    this.pendingTransactions = [];
    this.adjustDifficultyBlocks = 3;
    this.wallets = [];

    this.loadData();
  }

  createGenesisBlock() {
    return new Block(
      0,
      0,
      "0",
      calculateHash(0, "0", 0, 0),
      "Genesis Block",
      0,
      this.difficulty
    );
  }

  isValidBlock(proposedBlock) {
    const latestBlock = this.getLatestBlock();

    // Check if the block hash meets the difficulty requirement
    if (
      proposedBlock.hash.substring(0, proposedBlock.difficulty) !==
      Array(proposedBlock.difficulty + 1).join("0")
    ) {
      console.log("Block hash does not meet difficulty requirements.");
      return false;
    }

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

    // Check if the previous hash matches the hash of the latest block on the chain
    if (proposedBlock.previousHash !== latestBlock.hash) {
      console.log("Previous hash does not match hash of the latest block.");
      return false;
    }

    // All checks passed
    return true;
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  adjustDifficulty(numBlocks) {
    const targetMineTime = 100; // 0.1 seconds
    const recentBlocks = this.getRecentBlocks(numBlocks);

    if (recentBlocks.length < numBlocks) return; // If we don't have enough blocks yet, don't adjust

    const avgMineTime = this.getAverageMineTime(recentBlocks);

    if (avgMineTime < targetMineTime) {
      this.difficulty++;
    } else if (this.difficulty > 1) {
      // Ensure difficulty never drops below 1
      this.difficulty--;
    }
  }

  getRecentBlocks(n) {
    if (this.chain.length <= n) {
      return this.chain.slice(1); // Exclude genesis block
    } else {
      return this.chain.slice(-n); // Get last n blocks
    }
  }

  getAverageMineTime(blocks) {
    let total = 0;

    for (let i = 1; i < blocks.length; i++) {
      total += blocks[i].timestamp - blocks[i - 1].timestamp;
    }

    return total / (blocks.length - 1);
  }

  async saveData() {
    await fs.writeFile("./db.json", JSON.stringify(this, null, 2), "utf-8");
  }

  async loadData() {
    try {
      const data = await fs.readFile("./db.json", "utf-8");
      const json = JSON.parse(data);
      this.chain = json.chain;
      this.adjustDifficultyBlocks = json.adjustDifficultyBlocks;
      this.difficulty = json.difficulty;
      this.miningReward = json.miningReward;
      this.wallets = json.wallets;
    } catch (e) {}
  }

  async mineBlock(proposedBlock) {
    const isValidBlock = this.isValidBlock(proposedBlock);

    if (isValidBlock) {
      this.chain.push(proposedBlock);

      // In the minePendingTransactions method:

      if ((this.chain.length - 1) % this.adjustDifficultyBlocks === 0) {
        // Exclude genesis block in the count
        this.adjustDifficulty(this.adjustDifficultyBlocks); // Adjust difficulty based on the last 10 blocks
      }
      proposedBlock.data.forEach((tx) => {
        const wallet = this.wallets.find((w) => w.address === tx.coninbase);
        if (wallet) {
          wallet.balance += tx.amount;
        } else {
          this.wallets.push({
            address: tx.coninbase,
            balance: tx.amount,
          });
        }
      });
      await this.saveData();
      return true;
    } else {
      return false;
    }
  }

  getBalanceOfAddress(address) {
    const wallet = this.wallets.find((w) => w.address === address);
    return wallet;
  }
}

module.exports = { Blockchain, Block };
