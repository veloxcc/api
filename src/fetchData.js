require('dotenv').config();

const baseURL = process.env.BASE_URL;
const token = process.env.FEED_TOKEN;
const streamId = process.env.FEED_ID;

const axios = require('axios'); 
const endpointVersion = 'v3';
const endpoint = '/streams/contents';

const http = axios.create({
  baseURL,
  timeout: 5000,
  headers: {'Authorization': `OAuth ${token}`}
});

const getMetaUrl = items => {
  const result = items.find(item => item.type === 'text/html');
  return result ? result.href : null;
};

const isValidUrl = url => url && url.indexOf('http') === 0 || false;

const getUrl = ({
  originId,
  canonicalUrl,
  canonical,
  alternate,
}) => {
  const urls = {
    origin: originId,
    alternate: alternate && getMetaUrl(alternate),
    canonical: canonicalUrl || canonical && getMetaUrl(canonical),
  }
  if (isValidUrl(urls.canonical)) {
    return urls.canonical;
  } else if (isValidUrl(urls.alternate)) {
    return urls.alternate;
  }
  return urls.origin;
}

const getFeed = async () => {
  const params = {
    count: 200,
    streamId: streamId,
    ranked: 'engagement',
    newerThan: new Date().getTime() - (60*60*24*1000),
  };

  const response = await http.get(`/${endpointVersion}${endpoint}`, { params });
  const items = [];

  response.data.items.forEach(item => {

    const {
      fingerprint,
      title,
      origin: { title: source, htmlUrl: sourceUrl },
      crawled: time,
    } = item;

    items.push({
      fingerprint,
      title,
      url: getUrl(item),
      source,
      sourceUrl,
      time,
    })

  });

  const data = {
    items,
    rateLimit: {
      limit: response.headers['x-ratelimit-limit'],
      count: response.headers['x-ratelimit-count'],
      reset: response.headers['x-ratelimit-reset'],
    }
  };

  return data;
}

module.exports = getFeed;
