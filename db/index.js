const fileDb = require("./fileDb");
const mongoDb = require("./mongoDb");
const db = require("../config").db;

if (db == "file") {
  module.exports = fileDb;
} else if (db == "mongo") {
  module.exports = mongoDb;
}
