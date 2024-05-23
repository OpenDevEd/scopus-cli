import { AxiosError, AxiosResponse } from 'axios';
import fs from 'fs';
import GET from './utils/get';
import { ScopusSearchResponse } from './types/scopusSearchResponse';
import { ScopusSearchRequest } from './types/scopusSearchRequest';
import {
  handleAllPages,
  handleAllPagesInChunks,
  handleMultiplePages,
  parseSort,
  urlEncodeQuery,
  validateParameters,
} from './utils/search';
import { isStringTooLong, quotaExceededError } from './utils/utility';

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

  async search({
    query,
    view = 'STANDARD',
    toJson,
    retriveAllPages = false,
    perPage = 25,
    page = 1,
    startPage,
    endPage,
    chunkSize,
    date,
    sort,
  }: ScopusSearchRequest): Promise<AxiosResponse<ScopusSearchResponse>> {
    try {
      // Encode query string and replace spaces with '+'
      // and parentheses with their respective encoded values
      const encodedQuery = urlEncodeQuery(query);
      validateParameters(
        retriveAllPages,
        startPage,
        endPage,
        chunkSize,
        toJson,
        perPage,
      );
      if (retriveAllPages) {
        if (view !== 'COMPLETE') {
          perPage = 200;
        } else {
          perPage = 25;
        }
        page = 1;
      }

      if (startPage && endPage) {
        page = startPage;
      }

      // const makeRequest = async () => {
      //   await GET(`${this.baseUrl}/search/scopus`, this.headers, {
      //     query: encodedQuery,
      //     view,
      //     start: (page * perPage - perPage).toString(),
      //     count: perPage?.toString(),
      //   });
      // };
      // const isLong = await isStringTooLong(
      //   {
      //     query: encodedQuery,
      //     view,
      //     start: (page * perPage - perPage).toString(),
      //     count: perPage?.toString(),
      //   },
      //   this.baseUrl,
      //   this.headers,
      // );

      // if (isLong) {
      //   console.error('\x1b[31m-->Search query is too long\x1b[0m');
      //   process.exit(1);
      // }

      // Make GET request to Scopus API
      const url = `${
        this.baseUrl
      }/search/scopus?query=${encodedQuery}&view=${view}${
        retriveAllPages
          ? '&cursor=*'
          : `&start=${(page * perPage - perPage).toString()}`
      }&count=${perPage?.toString()}${date ? `&date=${date}` : ''}${
        sort ? `&sort=${parseSort(sort)}` : ''
      }`;

      const queryLength = query.length;
      const urlLength = url.length;
      const maxLength = 2800;

      const infoLength = `Query length: ${queryLength}\nURL length: ${urlLength}\nMax length: ${maxLength}`;
      console.log(infoLength);
      fs.writeFileSync('info.txt', infoLength);
      if (urlLength > maxLength) {
        console.error(
          '\x1b[31m-->URL length is too long. Please reduce the query length\x1b[0m',
        );
        process.exit(1);
      }

      const response = await GET(url, this.headers, {});
      // console.log('response:', response);

      if (retriveAllPages) {
        if (chunkSize) {
          response.data = await handleAllPagesInChunks(
            response.data,
            this.headers,
            chunkSize,
            toJson,
          );
        }
        response.data = await handleAllPages(response.data, this.headers);
      }
      if (startPage && endPage) {
        response.data = await handleMultiplePages(
          response.data,
          this.headers,
          startPage,
          endPage,
        );
      }
      // Write response to JSON file if toJson is provided
      if (toJson && !chunkSize) {
        if (response.status === 200) {
          fs.writeFileSync(
            `${toJson}.json`,
            JSON.stringify(response.data, null, 2),
          );
        }
      }
      return response;
    } catch (error) {
      const err = error as AxiosError;
      if (err.response?.status === 429) {
        quotaExceededError(err);
      }
      throw new Error(`GET request failed: ${error.message}`);
    }
  }
}
