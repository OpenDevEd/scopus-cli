import { AxiosError, AxiosResponse } from 'axios';
import fs from 'fs';
import GET from './utils/get';
import { ScopusSearchResponse } from './types/scopusSearchResponse';
import { ScopusSearchRequest } from './types/scopusSearchRequest';
import {
  handleAllPages,
  handleAllPagesInChunks,
  handleMultiplePages,
  urlEncodeQuery,
  validateParameters,
} from './utils/search';

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
    perPage = 25,
    page = 1,
    startPage,
    endPage,
    chunkSize,
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
        perPage = 25;
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

      // Make GET request to Scopus API
      const response = await GET(
        `${this.baseUrl}/search/scopus`,
        this.headers,
        {
          query: encodedQuery,
          view,
          start: (page * perPage - perPage).toString(),
          count: perPage?.toString(),
        },
      );

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
        const { headers } = err.response;
        const errorStatus = headers['X-ELS-Status'];
        const resetTime = headers['X-RateLimit-Reset'];
        const resetTimestamp = parseInt(resetTime, 10);
        const resetDate = new Date(resetTimestamp * 1000);

        if (errorStatus === 'QUOTA_EXCEEDED') {
          throw new Error(
            `Quota exceeded. Please try again after ${resetDate.toLocaleTimeString()}`,
          );
        }
      }
      throw new Error(`GET request failed: ${error.message}`);
    }
  }
}
