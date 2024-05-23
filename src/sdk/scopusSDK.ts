import { AxiosError } from 'axios';
import fs from 'fs';
import GET from './utils/get';
import { ReturnWithMeta } from './types/scopusSearchResponse';
import { ScopusSearchRequest } from './types/scopusSearchRequest';
import {
  checkLength,
  handleAllPages,
  handleAllPagesInChunks,
  handleMultipleResutls,
  metadata,
  parseSort,
  urlEncodeQuery,
  validateParameters,
} from './utils/search';
import { quotaExceededError } from './utils/utility';

export default class ScopusSDK {
  private apiKey: string;

  private baseUrl: string;

  private headers: Record<string, string>;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.elsevier.com/content';
    this.headers = {
      'X-ELS-APIKey': this.apiKey,
    };
  }

  async search({
    query,
    view = 'STANDARD',
    toJson,
    retriveAllPages = false,
    resultsNumber = 25,
    chunkSize,
    date,
    sort,
    keyType = 'Developer',
    meta,
  }: ScopusSearchRequest): Promise<ReturnWithMeta> {
    try {
      // Encode query string and replace spaces with '+'
      // and parentheses with their respective encoded values
      const encodedQuery = urlEncodeQuery(query);
      validateParameters(
        retriveAllPages,
        chunkSize,
        toJson,
        resultsNumber,
        keyType,
      );
      let perPage = 25;
      if (keyType === 'Institutional') {
        if (resultsNumber < 200) {
          perPage = resultsNumber;
          resultsNumber = 0;
        } else {
          perPage = 200;
          resultsNumber -= 200;
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (resultsNumber < 25) {
          perPage = resultsNumber;
          resultsNumber = 0;
        } else {
          perPage = 25;
          resultsNumber -= 25;
        }
      }
      let useCursor = false;
      if (retriveAllPages) {
        if (keyType === 'Institutional') {
          useCursor = true;
        }
      }
      const url = `${
        this.baseUrl
      }/search/scopus?query=${encodedQuery}&view=${view}${
        useCursor
          ? '&cursor=*'
          : '&start=0'
      }&count=${perPage?.toString()}${date ? `&date=${date}` : ''}${
        sort ? `&sort=${parseSort(sort)}` : ''
      }`;

      checkLength(query, url);

      const response = await GET(url, this.headers, {});
      let returns = metadata(response.data, meta, 'original');
      if (retriveAllPages) {
        if (chunkSize) {
          returns = await handleAllPagesInChunks(
            response.data,
            this.headers,
            chunkSize,
            toJson,
            meta,
          );
        }
        returns = await handleAllPages(response.data, this.headers, meta);
      }
      if (resultsNumber > 0) {
        returns = await handleMultipleResutls(
          response.data,
          this.headers,
          resultsNumber,
          perPage,
          meta,
        );
      }
      // Write response to JSON file if toJson is provided
      if (toJson && !chunkSize) {
        if (response.status === 200) {
          fs.writeFileSync(
            `${toJson}.json`,
            JSON.stringify(returns, null, 2),
          );
        }
      }
      return returns;
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 429) {
        quotaExceededError(err);
      }
      throw new Error(`GET request failed: ${error.message}`);
    }
  }

  async testKey(query: string) {
    const encodedQuery = urlEncodeQuery(query);
    try {
      console.log('----Testing API key----');
      const res = await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
      });
      console.log('Limit number of queries', res.headers['x-ratelimit-limit']);
      console.log('API key is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 401) {
        console.error('Invalid API key');
      }
      return;
    }

    // test view COMPLETE
    try {
      console.log('----Testing COMPLETE view----');
      await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
        view: 'COMPLETE',
      });
      console.log('COMPLETE view is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status !== 429) {
        console.error('COMPLETE view is invalid');
      } else if (err.response?.status === 429) {
        quotaExceededError(err);
      }
    }

    // test cursor
    try {
      console.log('----Testing cursor----');
      await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
        cursor: '*',
      });
      console.log('Cursor is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status !== 429) {
        console.error('Cursor is invalid');
      } else if (err.response?.status === 429) {
        quotaExceededError(err);
      }
    }

    // test count 1
    try {
      console.log('----Testing count 1----');
      await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
        count: '1',
      });
      console.log('Count 1 is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status !== 429) {
        console.error('Count 1 is invalid');
      } else if (err.response?.status === 429) {
        quotaExceededError(err);
      }
    }

    // test count 25
    try {
      console.log('----Testing count 25----');
      await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
        count: '25',
      });
      console.log('Count 25 is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status !== 429) {
        console.error('Count 25 is invalid');
      } else if (err.response?.status === 429) {
        quotaExceededError(err);
      }
    }

    // test count 50
    try {
      console.log('----Testing count 50----');
      await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
        count: '50',
      });
      console.log('Count 50 is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status !== 429) {
        console.error('Count 50 is invalid');
      } else if (err.response?.status === 429) {
        quotaExceededError(err);
      }
    }

    // test count 100
    try {
      console.log('----Testing count 100----');
      await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
        count: '100',
      });
      console.log('Count 100 is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status !== 429) {
        console.error('Count 100 is invalid');
      } else if (err.response?.status === 429) {
        quotaExceededError(err);
      }
    }

    // test count 200
    try {
      console.log('----Testing count 200----');
      await GET(`${this.baseUrl}/search/scopus`, this.headers, {
        query: encodedQuery,
        count: '200',
      });
      console.log('Count 200 is valid');
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status !== 429) {
        console.error('Count 200 is invalid');
      } else if (err.response?.status === 429) {
        quotaExceededError(err);
      }
    }
  }
}
