const { Block } = require("./blockchain");
const fetch = require("node-fetch-npm");
require("dotenv").config();
const p2p = require("./p2p");
const { calculateHash, sleep } = require("./utils");

async function minePendingTransactions(miningRewardAddress) {
  // Get latest block from the pool
  let miningInfo;
  try {
    const response = await fetch(process.env.pool + "/get-mining-info", {
      method: "GET",
    });

    const responseData = await response.json();
    miningInfo = responseData;
  } catch (error) {
    console.error(
      "Error fetch info from the pool wait 10 second and try again"
    );
    await sleep(10000);
    return;
  }
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
  block = mineBlock(block);

  // Send mined block to the pool
  try {
    const response = await fetch(process.env.pool + "/submit-block", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(block),
    });

    const responseData = await response.json();
  } catch (error) {
    console.error(
      "Error submitting block to the pool wait 10 second and try again"
    );
    await sleep(10000);
    return;
  }
}

function mineBlock(block) {
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
  }
  console.log(
    `Block mined: ${block.hash} height: ${block.index} difficulty: ${block.difficulty} nonce: ${block.nonce}`
  );
  return block;
}
async function autoMine(miningRewardAddress) {
  while (true) {
    await minePendingTransactions(miningRewardAddress);
  }
}

p2p.listen({ port: 3666 });

autoMine(process.env.miningRewardAddress);
