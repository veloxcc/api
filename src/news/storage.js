require('dotenv').config();

const auth = require('./auth');
const logger = require('../logger');
const MongoClient = require('mongodb').MongoClient;
const connectionUrl = process.env.DB_CONNECTION_STRING;

const clientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 8000,
};

const dbName = process.env.DB_NAME;
const colName = 'news';

module.exports.save = async function save(data) {
  const client = new MongoClient(connectionUrl, clientOptions);
  let success = false;
  try {
    await client.connect();

    const db = client.db(dbName);
    const tmpColName = `news_${new Date().getTime()}`;
    const collection = db.collection(colName);
    const tmpCollection = db.collection(tmpColName);
    const dropCollection = await collection.countDocuments() > 0;

    await tmpCollection.insertMany(data);
    if (dropCollection) await collection.drop();
    await tmpCollection.rename(colName);

    success = true;
  } catch (err) {
    logger(err.stack);
  }

  await client.close();
  return success;
}

module.exports.load = async function load() {
  const client = new MongoClient(connectionUrl, clientOptions);
  let success = false;
  try {
    await client.connect();

    const db = client.db(dbName);
    const col = db.collection(colName);

    success = await col.find({}, { sort: [['time', 'desc']]}).toArray();
  } catch (err) {
    logger(err.stack);
  }

  return success;
}

module.exports.getNewsSources = async function load() {
  const client = new MongoClient(connectionUrl, clientOptions);
  let success = false;
  try {
    await client.connect();

    const db = client.db(dbName);
    const col = db.collection('newsSources');

    success = await col.find().toArray();
  } catch (err) {
    logger(err.stack);
  }

  await client.close();
  return success;
}

module.exports.saveAccessToken = async function saveAccessToken(token) {
  if (!token) return false;

  const client = new MongoClient(connectionUrl, clientOptions);
  let success = false;

  try {
    await client.connect();

    const db = client.db(dbName);
    const col = db.collection('settings');

    const callback = await col.updateOne(
      { property: 'news_access_token' },
      { $set: { value: auth.encryptToken(token) } },
      { upsert: true }
    );

    success = callback.result.ok === 1;
  } catch (err) {
    logger(err.stack);
  }

  await client.close();
  return success;
}

module.exports.getAccessToken = async function getAccessToken() {
  const client = new MongoClient(connectionUrl, clientOptions);
  let success = false;
  try {
    await client.connect();

    const db = client.db(dbName);
    const col = db.collection('settings');

    const doc = await col.findOne({ property: 'news_access_token' });
    success = doc ? auth.decryptToken(doc.value) : false;
  } catch (err) {
    logger(err.stack);
  }

  await client.close();
  return success;
}
