import { AxiosResponse } from 'axios';
import GET from './utils/GET';

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
    query: string,
    view: 'STANDARD' | 'COMPLETE' = 'STANDARD',
  ): Promise<AxiosResponse> {
    try {
      const response = await GET(`${this.baseUrl}/search/scopus`, this.headers, { query, view });
      return response;
    } catch (error) {
      throw new Error(`GET request failed: ${error.message}`);
    }
  }
}
