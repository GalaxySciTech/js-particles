const { dbpath } = require("../config.js");
const path = require("path");
const fs = require("fs").promises;

const dataCache = {};

const getFilePath = async (col) => {
  const filePath = path.join(dbpath, `${col}.json`);

  await ensureFileExists(filePath);
  return filePath;
};

const ensureFileExists = async (filePath) => {
  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, "[]", "utf-8");
    } else {
      throw error;
    }
  }
};

const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
};

ensureDirectoryExists(dbpath);

const loadData = async (col) => {
  try {
    const data = await fs.readFile(await getFilePath(col), "utf-8");
    dataCache[col] = JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      dataCache[col] = [];
    } else {
      throw error;
    }
  }

  return dataCache[col];
};

const saveData = async (col) => {
  await fs.writeFile(
    await getFilePath(col),
    JSON.stringify(dataCache[col], null, 2),
    "utf-8"
  );
};

const find = async (col, query) => {
  const items = await loadData(col);
  return items.filter((item) => {
    for (let key in query) {
      if (item[key] !== query[key]) {
        return false;
      }
    }
    return true;
  });
};

const insert = async (col, datas) => {
  const items = await loadData(col);
  items.push(...datas);
  await saveData(col);
};

const update = async (col, query, updateOperation) => {
  const items = await loadData(col);
  const updatedItems = items.map((item) => {
    let match = true;
    for (let key in query) {
      if (item[key] !== query[key]) {
        match = false;
        break;
      }
    }

    if (!match) return item;

    let updatedItem = { ...item };

    if (updateOperation.$set) {
      for (let key in updateOperation.$set) {
        updatedItem[key] = updateOperation.$set[key];
      }
    }

    if (updateOperation.$unset) {
      for (let key in updateOperation.$unset) {
        if (updateOperation.$unset[key]) {
          delete updatedItem[key];
        }
      }
    }

    // Handling $inc operator
    if (updateOperation.$inc) {
      for (let key in updateOperation.$inc) {
        if (typeof updatedItem[key] === "number") {
          updatedItem[key] += updateOperation.$inc[key];
        }
      }
    }

    return updatedItem;
  });

  dataCache[col] = updatedItems;
  await saveData(col);
};

const del = async (col, query) => {
  const items = await loadData(col);
  const remainingItems = items.filter((item) => {
    for (let key in query) {
      if (item[key] === query[key]) {
        return false;
      }
    }
    return true;
  });

  dataCache[col] = remainingItems;
  await saveData(col);
};

module.exports = { find, insert, update, del };
