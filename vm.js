const { changeBalance } = require("./accounts");
const db = require("./db");
const opcodes = {
  receive: async (transaction) => {
    const success = await changeBalance(transaction.from, -transaction.amount);
    if (success) {
      await changeBalance(transaction.to, transaction.amount);
    }
  },
};
async function exec(transaction) {
  const accounts = await db.find("accounts", { address: transaction.from });
  if (accounts.length == 0) {
    return;
  }
  if ((accounts[0].index || 0) != transaction.index) {
    return;
  }
  const opcode = transaction.opcode;
  await opcodes[opcode](transaction);

  await db.del("pendingTransactions", { sig: transaction.sig });

  await db.update(
    "accounts",
    { address: transaction.from },
    { $set: { index: transaction.index + 1 } }
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
