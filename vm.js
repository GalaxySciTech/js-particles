const { changeBalance } = require("./accounts");

function exec(opcode) {}

async function coinbase(from, amount) {
  await changeBalance(coinbase, amount);
}

module.exports = {
  exec,
};
