const { changeBalance } = require("./accounts");

const opcodes = {
  receive: async (from, to, amount, input) => {
    const success = await changeBalance(from, -amount);
    if (success) {
      await changeBalance(to, amount);
    }
  },
};
function exec(transaction) {
  const opcode = transaction.opcode;
  opcodes[opcode](
    transaction.from,
    transaction.to,
    transaction.amount,
    transaction.input
  );
}

async function coinbase(from, amount) {
  await changeBalance(from, amount);
}

function isOpcode(opcode) {
  return opcodes[opcode] != undefined;
}

module.exports = {
  coinbase,
  exec,
  isOpcode,
};
