require('dotenv').config();

import auth from './auth';
import logger from '../logger';
import { MongoClient } from 'mongodb';

const connectionUrl = process.env.DB_CONNECTION_STRING;

const clientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 8000,
};

const dbName = process.env.DB_NAME;
const colName = 'news';
const client = new MongoClient(connectionUrl, clientOptions);

const save = async data => {
  let success = false;
  try {
    if (client.isConnected() === false)
      await client.connect();

    const db = client.db(dbName);
    const collection = db.collection(colName);
    const writeOperations = [];

    data.forEach(item => writeOperations.push(
      { updateOne: { filter: { article_id: item.article_id }, update: { $set: item }, upsert: true } }
    ));

    await collection.bulkWrite(writeOperations);

    success = true;
  } catch (err) {
    logger(err.stack);
  }

  return success;
}

const load = async ({ page = 0, pageSize = 20, }) => {
  let success = false;

  try {
    if (client.isConnected() === false)
      await client.connect();

    const db = client.db(dbName);
    const col = db.collection(colName);
    const skipCount = page * pageSize;

    success = await col.find({}, { sort: [['published', 'desc']]}).skip(skipCount).limit(pageSize).toArray();
  } catch (err) {
    logger(err.stack);
  }

  return success;
}

const getNewsSources = async () => {
  let success = false;
  try {
    if (client.isConnected() === false)
      await client.connect();

    const db = client.db(dbName);
    const col = db.collection('newsSources');

    success = await col.find().toArray();
  } catch (err) {
    logger(err.stack);
  }

  return success;
}

const saveAccessToken = async token => {
  if (!token) return false;

  let success = false;

  try {
    if (client.isConnected() === false)
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

  return success;
}

const getAccessToken = async () => {
  let success = false;
  try {
    if (client.isConnected() === false)
      await client.connect();

    const db = client.db(dbName);
    const col = db.collection('settings');

    const doc = await col.findOne({ property: 'news_access_token' });
    success = doc ? auth.decryptToken(doc.value) : false;
  } catch (err) {
    logger(err.stack);
  }

  return success;
}

export default {
  save,
  load,
  getNewsSources,
  getAccessToken,
  saveAccessToken,
};
