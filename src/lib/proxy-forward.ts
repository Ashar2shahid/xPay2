// Request forwarding utilities for proxy service
import { NextApiRequest, NextApiResponse } from 'next';

export interface ForwardRequest {
  originalUrl: string;
  requestPath: string;
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body?: any;
  timeout?: number;
}

export interface ForwardResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Forward a request to the original backend service
 */
export async function forwardRequest(
  forwardReq: ForwardRequest
): Promise<ForwardResponse> {
  const startTime = Date.now();

  try {
    console.log(`[Proxy] Forwarding ${forwardReq.method} to ${forwardReq.originalUrl}${forwardReq.requestPath}`);

    // Construct the full target URL
    const targetUrl = `${forwardReq.originalUrl}${forwardReq.requestPath}`;

    // Clean headers - remove proxy-specific headers
    const forwardHeaders = cleanHeaders(forwardReq.headers);

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method: forwardReq.method,
      headers: forwardHeaders,
      signal: AbortSignal.timeout(forwardReq.timeout || 30000) // 30 second default timeout
    };

    // Add body for non-GET requests
    if (forwardReq.method !== 'GET' && forwardReq.method !== 'HEAD' && forwardReq.body) {
      if (typeof forwardReq.body === 'string') {
        fetchOptions.body = forwardReq.body;
      } else {
        fetchOptions.body = JSON.stringify(forwardReq.body);
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'content-type': 'application/json'
        };
      }
    }

    // Make the request to the original backend
    const response = await fetch(targetUrl, fetchOptions);

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Get response body
    let responseBody;
    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else if (contentType.includes('text/')) {
      responseBody = await response.text();
    } else {
      // For binary data, convert to base64
      const buffer = await response.arrayBuffer();
      responseBody = Buffer.from(buffer).toString('base64');
      responseHeaders['x-proxy-encoding'] = 'base64';
    }

    const duration = Date.now() - startTime;

    return {
      status: response.status,
      headers: responseHeaders,
      body: responseBody,
      duration,
      success: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Proxy] Forward request failed:', error);

    return {
      status: 502,
      headers: { 'content-type': 'application/json' },
      body: {
        error: 'Bad Gateway',
        message: 'Failed to connect to backend service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      duration,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Clean headers to remove proxy-specific headers before forwarding
 */
function cleanHeaders(headers: Record<string, string | string[] | undefined>): Record<string, string> {
  const cleaned: Record<string, string> = {};

  // Headers to exclude from forwarding
  const excludeHeaders = new Set([
    'host', // Will be set automatically by fetch
    'x-payment', // Proxy-specific payment headers
    'x-payment-signature',
    'x-payment-challenge',
    'x-payment-required',
    'x-payment-response',
    'connection',
    'transfer-encoding',
    'content-length', // Will be set automatically by fetch
    'content-encoding', // Will be handled by Next.js
    'x-forwarded-for',
    'x-forwarded-proto',
    'x-forwarded-host'
  ]);

  Object.entries(headers).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();

    if (!excludeHeaders.has(lowerKey) && value !== undefined) {
      // Convert array values to comma-separated string
      cleaned[key] = Array.isArray(value) ? value.join(', ') : value;
    }
  });

  return cleaned;
}

/**
 * Send the forwarded response back to the client
 */
export function sendForwardedResponse(
  res: NextApiResponse,
  forwardResponse: ForwardResponse,
  additionalHeaders?: Record<string, string>
): void {
  try {
    // Set status code
    res.status(forwardResponse.status);

    // Headers to exclude from client response (to avoid conflicts)
    const excludeResponseHeaders = new Set([
      'content-length',
      'transfer-encoding',
      'content-encoding'
    ]);

    // Set response headers
    Object.entries(forwardResponse.headers).forEach(([key, value]) => {
      if (!excludeResponseHeaders.has(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });

    // Set additional headers (like payment response headers)
    if (additionalHeaders) {
      Object.entries(additionalHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    // Add proxy headers for debugging
    res.setHeader('X-Proxy-Duration', forwardResponse.duration.toString());
    res.setHeader('X-Proxy-Status', forwardResponse.success ? 'success' : 'error');

    // Send response body
    if (forwardResponse.headers['x-proxy-encoding'] === 'base64') {
      // Send binary data
      const buffer = Buffer.from(forwardResponse.body, 'base64');
      res.send(buffer);
    } else {
      // Send JSON or text
      res.send(forwardResponse.body);
    }

    console.log(`[Proxy] Response sent: ${forwardResponse.status} (${forwardResponse.duration}ms)`);

  } catch (error) {
    console.error('[Proxy] Failed to send response:', error);

    // Fallback error response
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Proxy Error',
        message: 'Failed to send backend response'
      });
    }
  }
}

/**
 * Extract request body from NextApiRequest
 */
export function extractRequestBody(req: NextApiRequest): any {
  // Next.js automatically parses JSON bodies
  return req.body;
}

/**
 * Validate that a URL is safe to proxy to
 */
export function validateProxyUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);

    // Only allow HTTP and HTTPS
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return false;
    }

    // Block localhost and private IPs in production
    if (process.env.NODE_ENV === 'production') {
      const hostname = parsedUrl.hostname.toLowerCase();

      // Block localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return false;
      }

      // Block private IP ranges (basic check)
      if (hostname.startsWith('192.168.') ||
          hostname.startsWith('10.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}