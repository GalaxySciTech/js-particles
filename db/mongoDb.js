const { MongoClient } = require("mongodb");

// Replace the uri string with your connection string.
const uri = "mongodb://127.0.0.1:27017";

const client = new MongoClient(uri);
const database = client.db("particles");

const find = async (col, query) => {
  const collection = database.collection(col);

  const cursor = collection.find(query);

  const list = [];
  for await (const doc of cursor) {
    delete doc["_id"];
    list.push(doc);
  }
  return list;
};

const insert = async (col, datas) => {
  if (datas.length == 0) return;
  const collection = database.collection(col);
  await collection.insertMany(datas);
};

const update = async (col, query, set) => {
  const collection = database.collection(col);
  const result = await collection.updateMany(query, set);
  // if (result["modifiedCount"] == 0)
  //   throw new Error(
  //     "Update count is zero query:" +
  //       JSON.stringify(query) +
  //       " set " +
  //       JSON.stringify(set)
  //   );
};

const del = async (col, query) => {
  const collection = database.collection(col);
  await collection.deleteMany(query);
};

module.exports = { find, insert, update, del };
