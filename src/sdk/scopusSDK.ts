import { AxiosError } from 'axios';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import GET from './utils/get';
import { ReturnWithMeta } from './types/scopusSearchResponse';
import { InfoObject, ScopusSearchRequest } from './types/scopusSearchRequest';
import {
  checkLength,
  handleAllPages,
  handleAllPagesInChunks,
  handleMultipleResults,
  handleMultipleResultsChuncked,
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
    limit = 25,
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
        limit,
        keyType,
      );
      let totalResults = limit;
      const startTime = new Date().getTime();
      let perPage = 25;
      let infoFile: string;

      if (!toJson) infoFile = 'info';
      else infoFile = toJson;

      if (keyType === 'Institutional' && view !== 'COMPLETE') {
        if (limit < 200) {
          perPage = limit;
          limit = 0;
        } else {
          perPage = 200;
          limit -= 200;
        }
      } else {
        // eslint-disable-next-line no-lonely-if
        if (limit < 25) {
          perPage = limit;
          limit = 0;
        } else {
          perPage = 25;
          limit -= 25;
        }
      }
      let useCursor = false;

      if (keyType === 'Institutional') {
        useCursor = true;
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
      meta.queryUrl = url;

      checkLength(query, url);

      const response = await GET(url, this.headers, {});
      let returns = metadata(response.data, meta, 'original');

      if (retriveAllPages) {
        totalResults = +response.data['search-results']['opensearch:totalResults'];
      }
      let itemsPerPage = +response.data['search-results']['opensearch:itemsPerPage'];
      if (itemsPerPage === 0) {
        itemsPerPage = perPage;
      }
      const totalNumberOfApiCallsNeeded = Math.ceil((totalResults / itemsPerPage));
      const endTime = new Date().getTime();
      const timeTaken = (endTime - startTime) / 1000;
      const currentApiRequestCallNumber = 1;
      const completionFraction = currentApiRequestCallNumber / totalNumberOfApiCallsNeeded;
      const estimatedTime = timeTaken / completionFraction;
      const estimatedTimeFormated = new Date(estimatedTime * 1000).toISOString().slice(11, 19);
      const remainingQuota = response.headers['x-ratelimit-remaining'];
      const timeToResetQuota = new Date(+response.headers['x-ratelimit-reset'] * 1000).toLocaleString();
      const progress = Math.round((currentApiRequestCallNumber
        / totalNumberOfApiCallsNeeded) * 100);
      const remainingTime = estimatedTime - timeTaken;
      const remainingTimeFormated = new Date(remainingTime * 1000).toISOString().slice(11, 19);
      const remainingQuotaAfterSearch = parseInt(response.headers['x-ratelimit-remaining'], 10) - totalNumberOfApiCallsNeeded + 1;

      const searchId = uuidv4();
      let infoString = `Total number of results: ${totalResults}
Items per page: ${itemsPerPage}
Total number of API calls needed: ${totalNumberOfApiCallsNeeded}
Time taken: ${timeTaken} seconds
Current API request call number: ${currentApiRequestCallNumber}
Estimated time: ${estimatedTimeFormated}
Remaining quota: ${remainingQuota}
Remaining quota after search: ${remainingQuotaAfterSearch}${remainingQuotaAfterSearch < 0 ? '\nWarning: Query quota will be exhausted before search is finished.' : ''}
Time to reset quota: ${timeToResetQuota}
Progress: ${progress}%
Remaining time: ${remainingTimeFormated}
\n`;

      // if (fs.existsSync(`${infoFile}.info.txt`)) {
      //   fs.unlinkSync(`${infoFile}.info.txt`);
      // }
      const searchSpliterBegin = `\n-------Begin Search ID: ${searchId}-------\n`;
      const searchSpliterEnd = `\n-------End Search ID: ${searchId}-------\n`;
      fs.appendFileSync(`${infoFile}.info.txt`, searchSpliterBegin);
      fs.appendFileSync(`${infoFile}.info.txt`, infoString);
      console.log(infoString);

      const infoObject: InfoObject = {
        startTime,
        endTime,
        totalResults,
        itemsPerPage,
        totalNumberOfApiCallsNeeded,
        timeTaken,
        currentApiRequestCallNumber,
        completionFraction,
        estimatedTime,
        remainingQuota,
        timeToResetQuota,
        progress,
        remainingTime,
        remainingQuotaAfterSearch,
        remainingTimeFormated,
      };

      meta.searchId = searchId;

      if (retriveAllPages) {
        if (chunkSize) {
          returns = await handleAllPagesInChunks(
            response.data,
            this.headers,
            chunkSize,
            toJson,
            meta,
            infoObject,
          );
        } else {
          returns = await handleAllPages(response.data, this.headers, meta, infoFile, infoObject);
        }
      }
      if (limit > 0 || chunkSize) {
        if (chunkSize) {
          returns = await handleMultipleResultsChuncked(
            response.data,
            this.headers,
            limit,
            perPage,
            meta,
            infoFile,
            infoObject,
            toJson,
            chunkSize,
          );
        } else if (limit > 0) {
          returns = await handleMultipleResults(
            response.data,
            this.headers,
            limit,
            perPage,
            meta,
            infoFile,
            infoObject,
          );
        }
      }

      // Write response to JSON file if toJson is provided
      infoString = '';
      if (!chunkSize) infoString = `\nResults: ${returns.results.length}`;
      if (toJson && !chunkSize) {
        if (response.status === 200) {
          infoString += `\nOutput file: ${toJson}.json`;
          fs.writeFileSync(
            `${toJson}.json`,
            JSON.stringify(returns, null, 2),
          );
        }
      }
      console.log(infoString);
      fs.appendFileSync(`${infoFile}.info.txt`, infoString);
      fs.appendFileSync(`${infoFile}.info.txt`, searchSpliterEnd);
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
