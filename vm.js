const { changeBalance } = require("./accounts");
const db = require("./db");
const opcodes = {
  receive: async (from, to, amount, input) => {
    const success = await changeBalance(from, -amount);
    if (success) {
      await changeBalance(to, amount);
    }
  },
};
async function exec(transaction) {
  const opcode = transaction.opcode;
  await opcodes[opcode](
    transaction.from,
    transaction.to,
    transaction.amount,
    transaction.input
  );

  await db.del("pendingTransactions", { sig: transaction.sig });
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
