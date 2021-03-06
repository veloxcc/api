require('dotenv').config();

import axios from 'axios';
import auth from './auth';
import storage from './storage';
import logger from '../logger';

const baseURL = process.env.API_BASE_URL;
const streamId = process.env.API_FEED_ID;

const http = axios.create({
  baseURL,
  timeout: 3000,
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
  const newThanInHours = 5;
  const params = {
    count: 1000,
    streamId: streamId,
    newerThan: new Date().getTime() - (60*60*newThanInHours*1000),
  };
  const token = await storage.getAccessToken();
  const headers = {'Authorization': `OAuth ${token}`};
  const response = await http.get('/v3/streams/contents', { params, headers });
  const newsSources = await storage.getNewsSources() || [];
  const items = [];

  const getSourceTitle = title => {
    const match = newsSources.find(({ source }) => source === title);
    return match && match.formatted || title;
  };

  response.data.items.forEach(item => {
    const {
      id: article_id,
      title,
      origin: { title: source, htmlUrl: sourceUrl },
      crawled: published,
      visual,
      engagement,
      engagementRate,
    } = item;

    const image = visual && visual.url || null;

    items.push({
      article_id,
      title,
      url: getUrl(item),
      source: {
        title: getSourceTitle(source),
        url: sourceUrl,
      },
      image,
      published,
      engagement,
      engagementRate,
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

export default fetch;
