import { AxiosError } from 'axios';

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => { setTimeout(resolve, ms); });
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
