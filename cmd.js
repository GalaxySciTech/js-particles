const yargs = require("yargs");
const {
  isAddress,
  sign,
  isPositiveInteger,
  recoveryFromSig,
  uint8ArrayToHex,
  addressFromPrivateKeyHex,
  calculateHash,
} = require("./utils");
const { getBalanceOfAddress, addTransaction, getAccount } = require("./p2p");
const { walletPrivateKey } = require("./config");
const { getAccounts } = require("./accounts");

yargs
  .command({
    command: "help",
    describe: "Display the help message",
    handler: () => {
      console.log("This is the help message:");
    },
  })
  .command({
    command: "getBalance",
    describe: "get balance of address",
    builder: {
      address: {
        describe: "Address to get balance for",
        demandOption: true,
        type: "string",
      },
    },
    handler: async (argv) => {
      const address = argv.address;
      if (!isAddress(address)) {
        console.log("Invalid address");
      }
      const wallet = await getBalanceOfAddress(address);
      console.log(wallet?.balance);
    },
  })
  .command({
    command: "sendTransaction",
    describe: "send a transaction",
    builder: {
      to: {
        describe: "Address to send to",
        demandOption: true,
        type: "string",
      },
      amount: {
        describe: "Amount to send",
        demandOption: true,
        type: "number",
      },
    },
    handler: async (argv) => {
      const from = addressFromPrivateKeyHex(walletPrivateKey);
      const account = await getAccount(from);
      const index = account?.index || 0;

      const to = argv.to;
      const amount = argv.amount;

      if (!isAddress(to)) {
        console.error("Invalid to address");
        return;
      }
      if (!isPositiveInteger(amount)) {
        console.error("Invalid amount");
        return;
      }
      const transaction = {
        from,
        to,
        amount,
        opcode: "receive",
        index,
        hash: "",
      };
      transaction.hash = calculateHash(transaction);
      const sig = sign(JSON.stringify(transaction), walletPrivateKey);

      transaction.sig = sig;

      const res = await addTransaction(transaction);

      if (res.status == 0) {
        console.log(res.result);
        return;
      }
      console.log(transaction);
    },
  })
  .demandCommand(1, "You need at least one command before moving on")
  .help().argv;
