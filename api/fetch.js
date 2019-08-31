const fetchData = require('../src/fetchData');
const storage = require('../src/storage');
const cacheTimeInSeconds = 3600;

module.exports = async (req, res) => {
  const response = await asyncTask(res);
  const status = response === false ? 400 : 200;
  if (response !== false) {
    res.setHeader('Cache-Control', `s-maxage=${cacheTimeInSeconds}`);
  }
  res.status(status).send();
}

const asyncTask = async res => {
  try {
    const data = await fetchData();
    if (data) {
      const { items, rateLimit } = data;
      res.setHeader('velox-count', rateLimit.count);
      await storage.save(items);
    }
    return true;
  } catch(err) {
    if (err.response) {
      const { data: errorData } = err.response;
      console.log(err && `Error: ${err.message}${ errorData ? `, ${errorData.errorMessage}` : ''}`);
    } else {
      console.log(err.message);
    }
    return false;
  }
}
