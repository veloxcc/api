require('dotenv').config();

const axios = require('axios'); 
const auth = require('./auth');
const storage = require('./storage');
const logger = require('../logger');

const baseURL = process.env.API_BASE_URL;
const streamId = process.env.API_FEED_ID;

const http = axios.create({
  baseURL,
  timeout: 5000,
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

const fetch = async () => {
  const params = {
    count: 200,
    streamId: streamId,
    ranked: 'engagement',
    newerThan: new Date().getTime() - (60*60*24*1000),
  };
  const token = await storage.getAccessToken();
  const headers = {'Authorization': `OAuth ${token}`};
  const response = await http.get('/v3/streams/contents', { params, headers });
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

http.interceptors.response.use(undefined, async error => {
  const { config, response: { status } } = error;
  const originalRequest = config;

  if (status === 401) {
    const response = await auth.refreshToken();
    if (!response) {
      logger('Failed to refresh token');
      return Promise.reject(new Error());
    }

    const result = await storage.saveAccessToken(response.access_token);
    if (!result) {
      logger('Failed to save access token');
      return Promise.reject(error);
    }

    originalRequest.headers.Authorization = `OAuth ${response.access_token}`;
    return http(originalRequest);
  }
  return Promise.reject(error);
});

module.exports = fetch;
