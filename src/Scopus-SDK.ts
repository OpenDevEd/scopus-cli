import { AxiosResponse } from 'axios';
import fs from 'fs';
import GET from './utils/GET';
import { ScopusSearchResponse } from './types/ScopusSearchResponse';
import { ScopusSearchRequest } from './types/ScopusSearchRequest';

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
    }: ScopusSearchRequest,
  ): Promise<AxiosResponse<ScopusSearchResponse>> {
    try {
      const encodedQuery = encodeURIComponent(query).replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29');

      let fieldString = '';
      if (field) {
        if (Array.isArray(field)) {
          fieldString = field.map((f) => {
            if (f.includes('.')) {
              return f.split('.').join(',');
            }
            return f;
          }).join(',');
        } else if (field.includes('.')) {
          fieldString = field.split('.').join(',');
        } else {
          fieldString = field;
        }
      }

      let sortString = '';
      if (sort) {
        if (Array.isArray(sort)) {
          const first3 = sort.slice(0, 3);
          sortString = first3.map((s) => {
            if (!s.order) {
              return `${s.field}`;
            }
            if (s.order === 'asc') {
              return `+${s.field}`;
            }
            return `-${s.field}`;
          }).join(',');
        } else if (!sort.order) {
          sortString = `${sort.field}`;
        } else if (sort.order === 'asc') {
          sortString = `+${sort.field}`;
        } else if (sort.order === 'desc') {
          sortString = `-${sort.field}`;
        }
      }

      let subjString = '';
      if (subj) {
        if (Array.isArray(subj)) {
          subjString = subj.join(',');
        } else {
          subjString = subj;
        }
      }

      let facetsString = '';
      if (facets) {
        if (Array.isArray(facets)) {
          facetsString = facets.map((facet) => {
            const {
              option, count: countFacet, sort: sortFacet, prefix,
            } = facet;
            return `{"option":"${option}"${countFacet ? `,"count":${countFacet}` : ''}${sortFacet ? `,"sort":"${sortFacet}"` : ''}${prefix ? `,"prefix":"${prefix}"` : ''}}`;
          }).join(',');
        } else {
          facetsString = `{"option":"${facets.option}"${facets.count ? `,"count":${facets.count}` : ''}${facets.sort ? `,"sort":"${facets.sort}"` : ''}${facets.prefix ? `,"prefix":"${facets.prefix}"` : ''}}`;
        }
      }

      const response = await GET(
        `${this.baseUrl}/search/scopus`,
        this.headers,
        {
          query: encodedQuery,
          view,
          field: fieldString,
          suppressNavLinks: suppressNavLinks.toString(),
          date,
          start: start?.toString(),
          count: count?.toString(),
          sort: sortString,
          content,
          subj: subjString,
          alias: alias.toString(),
          cursor,
          facets: facetsString,
        },
      );
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
