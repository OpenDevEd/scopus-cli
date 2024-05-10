import axios, { AxiosResponse } from 'axios';
import { ScopusSearchResponse } from '../types/scopusSearchResponse';

async function GET(
  url: string,
  headers: Record<string, string>,
  queryParams: Record<string, string>,
): Promise<AxiosResponse<ScopusSearchResponse>> {
  try {
    const response = await axios.get(url, {
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
