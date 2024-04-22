import { AxiosResponse } from 'axios';
import fs from 'fs';
import GET from './utils/get';
import { ScopusSearchResponse } from './types/scopusSearchResponse';
import { ScopusSearchRequest } from './types/scopusSearchRequest';
import {
  handleAllPages,
  parseCountAndStart,
  parseFacets, parseField, parseSort, parseSubj,
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

  async search(
    {
      query,
      view = 'STANDARD',
      field,
      suppressNavLinks = false,
      date,
      start,
      count,
      sort,
      content = 'all',
      subj,
      alias = true,
      cursor,
      facets,
      toJson,
      retriveAllPages,
    }: ScopusSearchRequest,
  ): Promise<AxiosResponse<ScopusSearchResponse>> {
    try {
      // Encode query string and replace spaces with '+'
      // and parentheses with their respective encoded values
      const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29');

      const fieldString = parseField(field);

      const sortString = parseSort(sort);

      const subjString = parseSubj(subj);

      const facetsString = parseFacets(facets);

      const { searchStart, searchCount } = parseCountAndStart(count, start, retriveAllPages);

      // Make GET request to Scopus API
      const response = await GET(
        `${this.baseUrl}/search/scopus`,
        this.headers,
        {
          query: encodedQuery,
          view,
          field: fieldString,
          suppressNavLinks: suppressNavLinks.toString(),
          date,
          start: searchStart?.toString(),
          count: searchCount?.toString(),
          sort: sortString,
          content,
          subj: subjString,
          alias: alias.toString(),
          cursor,
          facets: facetsString,
        },
      );
      if (retriveAllPages) {
        response.data = await handleAllPages(response.data, this.headers);
      }
      // Write response to JSON file if toJson is provided
      if (toJson) {
        if (response.status === 200) {
          fs.writeFileSync(`${toJson}.json`, JSON.stringify(response.data, null, 2));
        }
      }
      return response;
    } catch (error) {
      throw new Error(`GET request failed: ${error.message}`);
    }
  }
}
