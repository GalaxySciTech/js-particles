const { sleep } = require("./utils");
const fetch = require("node-fetch-npm");
const config = require("./config");

// Get latest block from the pool
async function getMiningInfo() {
  return get("/getMiningInfo");
}

async function getAccount(address) {
  return get("/getAccount?address=" + address);
}

async function submitBlock(block) {
  return post("/submitBlock", block);
}

async function getBalanceOfAddress(address) {
  return get("/getBalance?address=" + address);
}
async function addTransaction(transaction) {
  return post("/addTransaction", transaction);
}

async function get(url) {
  try {
    const response = await fetch(config.pool + url);

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw Error("fetch data from pool falied " + error);
  }
}

async function post(url, data) {
  try {
    const response = await fetch(config.pool + url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    throw Error("fetch data from pool falied " + error);
  }
}

module.exports = {
  getBalanceOfAddress,
  getMiningInfo,
  submitBlock,
  addTransaction,
  getAccount,
};
