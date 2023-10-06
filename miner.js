const blockchain = require("./blockchain");
const config = require("./config");
const abi = require("./abi");
const { calculateHash, sleep } = require("./utils");
const p2p = require("./p2p");
const Block = require("./block");

async function minePendingTransactions(miningRewardAddress) {
  const miningInfo = await p2p.getMiningInfo();
  if (!miningInfo) return;
  const blockchain = miningInfo.blockchain;
  const latestBlock = miningInfo.latestBlock;
  const pendingTransactions = miningInfo.pendingTransactions;
  const coinbaseTx = miningInfo.coinbaseTx;
  coinbaseTx.from = miningRewardAddress;

  pendingTransactions.unshift(coinbaseTx);

  const index = (latestBlock.index || 0) + 1;
  let block = Block(
    index,
    Date.now(),
    latestBlock.hash,
    "",
    pendingTransactions,
    0,
    blockchain.difficulty
  );
  block = await mineBlock(block);
  if (!block) {
    return;
  }
  const res = await p2p.submitBlock(block);
  const status = res?.status;
  const result = res?.result;
  if (status == 1) {
    console.log("submit block success ", JSON.stringify(block));
  } else {
    console.log("submit block error ", result);
  }
}

async function mineBlock(block) {
  let checkTime = Date.now();
  let startTime = Date.now();
  let hashesTried = 0;
  block.hash = calculateHash(
    block.index,
    block.previousHash,
    block.transactions,
    block.timestamp,
    block.nonce
  );

  while (BigInt("0x" + block.hash) >= BigInt(block.difficulty)) {
    block.nonce++;
    block.hash = calculateHash(
      block.index,
      block.previousHash,
      block.transactions,
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
        await main();
      }
    }
  } else {
    await blockchain.init();
  }
}

abi.listen({ port: 3666 });

main();
