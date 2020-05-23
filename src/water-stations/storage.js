require('dotenv').config();

import logger from '../logger';
import { MongoClient } from 'mongodb';

const connectionUrl = process.env.DB_CONNECTION_STRING;

const clientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const databaseName = process.env.DB_NAME;
const collectionName = 'waterStations';
const client = new MongoClient(connectionUrl, clientOptions);

export const getByBox = async ({ sw, ne }) => {
  let docs = [];
  try {
    if (client.isConnected() === false)
      await client.connect();

    const bounds = [sw, ne];
    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    docs = await collection.find(
      { 'geometry.coordinates':
        { $geoWithin: {
            $box: bounds,
          }
        }
      }
    ).toArray();

  } catch (err) {
    logger(err.stack);
  }

  return docs;
}

export const getByRadius = async ({ lat, lng, r = 2500}) => {
  let docs = [];
  try {
    if (client.isConnected() === false)
      await client.connect();

    const coordinates = [lng, lat];
    const db = client.db(databaseName);
    const collection = db.collection(collectionName);

    docs = await collection.find(
      { 'geometry.coordinates':
        { $near :
          { $geometry:
            { type: 'Point',  coordinates },
              $maxDistance: r,
          }
        }
      }
    ).toArray();

  } catch (err) {
    logger(err.stack);
  }

  return docs;
}

export default {
  getByRadius,
  getByBox,
};
