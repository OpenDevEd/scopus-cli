import { AxiosError } from 'axios';
import GET from './get';

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function quotaExceededError(err: AxiosError) {
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

export async function isStringTooLong(
  queryParams: Record<string, string>,
  baseUrl: string,
  headers: Record<string, string>,
) {
  try {
    await GET(`${baseUrl}/search/scopus`, headers, queryParams);
    return false;
  } catch (error) {
    const err = error as AxiosError;
    if (err.response.status === 413) {
      return true;
    }
    throw error;
  }
}
