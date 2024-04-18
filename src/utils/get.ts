import axios, { AxiosResponse } from 'axios';

async function GET(
  url: string,
  headers: Record<string, string>,
  queryParams: Record<string, string>,
): Promise<AxiosResponse> {
  try {
    const response = await axios.get(url, {
      headers,
      params: queryParams,
    });
    return response;
  } catch (error) {
    throw new Error(`GET request failed: ${error.message}`);
  }
}

export default GET;
