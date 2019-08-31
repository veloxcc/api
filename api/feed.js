const storage = require('../src/storage');
const cacheTimeInSeconds = 300;

module.exports = async (req, res) => {
  const response = await asyncTask();
  const status = response === false ? 400 : 200;
  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send(response || '');
}

const asyncTask = async () => {
  try {
    const data = await storage.load();
    return data;
  } catch(err) {
    console.log(err);
  }
  return false;
}
