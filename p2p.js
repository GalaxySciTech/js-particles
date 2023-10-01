const { sleep } = require("./utils");
const fetch = require("node-fetch-npm");
const config = require("./config");

// Get latest block from the pool
async function getMiningInfo() {
  return get(config.pool + "/get-mining-info");
}

async function submitBlock(block) {
  return post(config.pool + "/submit-block", block);
}

async function get(url) {
  try {
    const response = await fetch(url);

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(
      "Error fetch info from the pool wait 1 second and try again",
      error
    );
    await sleep(1000);
  }
}

async function post(url, data) {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error(
      "Error submitting block to the pool wait 1 second and try again"
    );
    await sleep(1000);
  }
}

module.exports = {
  getMiningInfo,
  submitBlock,
};
