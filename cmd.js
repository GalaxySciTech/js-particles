const yargs = require("yargs");
const { isAddress } = require("./utils");
const { getBalanceOfAddress, addTransaction } = require("./p2p");

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
    command: "sendTrasnaction",
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
    handler: async () => {
      console.log("wait implement");
      //   const transaction = {};
      //   await addTransaction(transaction);
    },
  })
  .demandCommand(1, "You need at least one command before moving on")
  .help().argv;
