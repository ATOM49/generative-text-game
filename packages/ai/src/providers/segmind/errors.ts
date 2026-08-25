const MAX_ERROR_BODY_LENGTH = 2_000;

export const sanitizeSegmindErrorBody = (body: string): string =>
  body
    .replace(/SG_[A-Za-z0-9_-]+/g, '[redacted]')
    .slice(0, MAX_ERROR_BODY_LENGTH);

export class SegmindApiError extends Error {
  readonly status: number;
  readonly responseBody?: string;

  constructor(message: string, status: number, responseBody?: string) {
    super(message);
    this.name = 'SegmindApiError';
    this.status = status;
    this.responseBody = responseBody
      ? sanitizeSegmindErrorBody(responseBody)
      : undefined;
  }
}

export class SegmindInferenceError extends Error {
  readonly requestId: string;

  constructor(requestId: string, message: string) {
    super(message);
    this.name = 'SegmindInferenceError';
    this.requestId = requestId;
  }
}

export class SegmindTimeoutError extends Error {
  readonly timeoutMs: number;
  readonly requestId?: string;

  constructor(timeoutMs: number, requestId?: string) {
    super(
      requestId
        ? `Segmind request ${requestId} timed out after ${timeoutMs}ms`
        : `Segmind request timed out after ${timeoutMs}ms`,
    );
    this.name = 'SegmindTimeoutError';
    this.timeoutMs = timeoutMs;
    this.requestId = requestId;
  }
}
