require('dotenv').config();

const logger = require('../logger');
const MongoClient = require('mongodb').MongoClient;
const connectionUrl = process.env.DB_CONNECTION_STRING;

const clientOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

const dbName = process.env.DB_NAME;
const colName = 'waterStations';

module.exports.load = async function load({ lat, lng, r = 2500}) {
  const client = new MongoClient(connectionUrl, clientOptions);
  let docs = [];
  try {
    await client.connect();

    const coordinates = [lng, lat];
    const db = client.db(dbName);
    const collection = db.collection(colName);

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
