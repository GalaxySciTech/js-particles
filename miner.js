const { Block } = require("./blockchain");
const config = require("./config");
const abi = require("./abi");
const { calculateHash, sleep } = require("./utils");
const p2p = require("./p2p");

async function minePendingTransactions(miningRewardAddress) {
  const miningInfo = await p2p.getMiningInfo();
  if (!miningInfo) return;
  const latestBlock = miningInfo.latestBlock;
  const difficulty = miningInfo.difficulty;
  const miningReward = miningInfo.miningReward;
  const pendingTransactions = miningInfo.pendingTransactions;

  const coninbaseTx = {
    coninbase: miningRewardAddress,
    amount: miningReward,
  };
  pendingTransactions.push(coninbaseTx);

  const index = latestBlock.index + 1;
  let block = new Block(
    index,
    Date.now(),
    latestBlock.hash,
    "",
    pendingTransactions,
    0,
    difficulty
  );
  block = await mineBlock(block);
  await p2p.submitBlock(block);
}

async function mineBlock(block) {
  let checkTime = Date.now();
  let startTime = Date.now();
  let hashesTried = 0;

  while (
    block.hash.substring(0, block.difficulty) !==
    Array(block.difficulty + 1).join("0")
  ) {
    block.nonce++;
    block.hash = calculateHash(
      block.index,
      block.previousHash,
      block.data,
      block.timestamp,
      block.nonce
    );
    hashesTried++;

    // Output rate every second
    if (Date.now() - startTime > 1000) {
      process.stdout.write(`\rHashing rate: ${hashesTried} hashes/sec`);
      hashesTried = 0; // Reset the counter
      startTime = Date.now(); // Reset the timestamp
    }
    if (checkTime - Date.now() > 5000) {
      const miningInfo = await p2p.getMiningInfo();
      if (!miningInfo) return;
      const latestBlock = miningInfo.latestBlock;
      if (latestBlock.index >= block.index) {
        console.log("Block already mined by another miner");
        return;
      }
      checkTime = Date.now();
    }
  }

  console.log("\n"); // New line to ensure subsequent outputs are on a new line
  console.log(
    `Block mined: ${block.hash} height: ${block.index} difficulty: ${block.difficulty} nonce: ${block.nonce} coinbase :${block.data[0].coninbase}}`
  );
  return block;
}

async function main() {
  if (config.isMiner == 1) {
    const minerAddress = config.minerAddress;
    await abi.ready();
    while (true) {
      try {
        await minePendingTransactions(minerAddress);
      } catch (e) {
        console.log("sleep 1 second for error :", e);
        await sleep(1000);
        await autoMine(minerAddress);
      }
    }
  }
}

abi.listen({ port: 3666 });

main();
