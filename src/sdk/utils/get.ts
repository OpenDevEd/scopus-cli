import axios, { AxiosResponse } from 'axios';
import { ScopusSearchResponse } from '../types/scopusSearchResponse';

const httpClient = axios.create()
httpClient.defaults.timeout = 60000

async function GET(
  url: string,
  headers: Record<string, string>,
  queryParams: Record<string, string>,
): Promise<AxiosResponse<ScopusSearchResponse>> {
  try {
    const response = await httpClient.get(url, {
      headers,
      params: queryParams,
    });
    return response;
  } catch (error) {
    console.error(`GET request failed: ${error.message}`);
    throw error;
  }
}

export default GET;
