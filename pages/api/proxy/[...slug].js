import { db, proxiedServices, apiLogs } from '../../../src/lib/db';
import { eq } from 'drizzle-orm';
import {
  extractPaymentFromHeaders,
  createPaymentChallenge,
  formatPaymentHeaders
} from '../../../src/lib/payment';
import {
  verifyX402Payment,
  settleX402Payment,
  convertToX402PaymentPayload,
  createX402PaymentRequirements
} from '../../../src/lib/x402-facilitator';
import {
  forwardRequest,
  sendForwardedResponse,
  extractRequestBody,
  validateProxyUrl
} from '../../../src/lib/proxy-forward';

export default async function handler(req, res) {
  try {
    // 1. Extract proxy slug from URL path
    const { slug } = req.query; // slug will be an array like ['service-name', 'endpoint', 'path']

    if (!slug || !Array.isArray(slug) || slug.length === 0) {
      return res.status(400).json({ error: 'Invalid proxy path' });
    }

    const proxySlug = slug[0]; // First part is the service identifier
    const requestPath = '/' + slug.slice(1).join('/'); // Remaining path for the backend

    // 2. Look up the original backend URL from database
    const service = await db.select()
      .from(proxiedServices)
      .where(eq(proxiedServices.proxySlug, proxySlug))
      .limit(1);

    // 3. Validate service exists and is active
    if (!service.length || !service[0].isActive) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // 3.1. Validate the original URL is safe to proxy to
    if (!validateProxyUrl(service[0].originalUrl)) {
      return res.status(400).json({ error: 'Invalid backend URL' });
    }

    // 4. Extract and validate payment
    const paymentPayload = extractPaymentFromHeaders(req.headers);
    const paymentRequirements = {
      amount: service[0].pricePerRequest.toString(),
      currency: service[0].currency,
      network: service[0].network,
      payTo: service[0].payTo,
      description: `Payment for ${service[0].title} API access`
    };

    let paymentStatus = 'pending';
    let paymentError = null;

    if (!paymentPayload) {
      // No payment provided - return HTTP 402 Payment Required
      const challenge = createPaymentChallenge(paymentRequirements);
      const headers = formatPaymentHeaders(challenge);

      // Set headers before sending response
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      return res.status(402).json({
        error: 'Payment Required',
        message: 'This API requires payment to access',
        paymentRequired: paymentRequirements,
        challenge: challenge
      });
    }

    // Convert to x402 format and verify payment using real x402 facilitator
    let x402PaymentPayload;
    let x402PaymentRequirements;

    try {
      x402PaymentPayload = convertToX402PaymentPayload({
        'x-payment': req.headers['x-payment'],
        'x-payment-signature': req.headers['x-payment-signature']
      }, service[0].network);

      x402PaymentRequirements = createX402PaymentRequirements(
        service[0].pricePerRequest.toString(),
        service[0].network,
        service[0].payTo,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${proxySlug}`,
        `Payment for ${service[0].title} API access`
      );

      const verification = await verifyX402Payment(x402PaymentPayload, x402PaymentRequirements);
      if (!verification.isValid) {
        paymentStatus = 'failed';
        paymentError = verification.invalidReason;

        const challenge = createPaymentChallenge(paymentRequirements);
        const headers = formatPaymentHeaders(challenge);

        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        return res.status(402).json({
          error: 'Payment Invalid',
          message: verification.invalidReason,
          paymentRequired: paymentRequirements,
          challenge: challenge
        });
      }

      paymentStatus = 'verified';
    } catch (conversionError) {
      console.error('[Proxy] Payment conversion error:', conversionError);
      paymentStatus = 'failed';
      paymentError = `Payment format error: ${conversionError.message}`;

      const challenge = createPaymentChallenge(paymentRequirements);
      const headers = formatPaymentHeaders(challenge);

      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      return res.status(402).json({
        error: 'Payment Format Error',
        message: conversionError.message,
        paymentRequired: paymentRequirements,
        challenge: challenge
      });
    }

    // 5. Settlement phase (steps 8-11 from x402 protocol)
    let settlementStatus = 'pending';
    let settlementTxHash = null;
    let settlementError = null;

    const enableSettlement = process.env.ENABLE_SETTLEMENT === 'true';

    if (enableSettlement && process.env.EVM_PRIVATE_KEY) {
      try {
        console.log('[Proxy] Starting settlement phase');

        // Call x402 settle function (step 8 in diagram)
        const settlementResult = await settleX402Payment(
          x402PaymentPayload,
          x402PaymentRequirements,
          process.env.EVM_PRIVATE_KEY
        );

        if (settlementResult.success) {
          settlementStatus = 'settled';
          settlementTxHash = settlementResult.transaction;
          console.log(`[Proxy] Settlement successful: ${settlementTxHash}`);
        } else {
          settlementStatus = 'failed';
          settlementError = settlementResult.errorReason;
          console.log(`[Proxy] Settlement failed: ${settlementError}`);
        }
      } catch (error) {
        settlementStatus = 'failed';
        settlementError = `Settlement error: ${error.message}`;
        console.error('[Proxy] Settlement error:', error);

        // Settlement failure shouldn't block the request - payment was verified
        // We'll still proceed to fulfill the request
      }
    } else {
      settlementStatus = 'disabled';
      console.log('[Proxy] Settlement disabled or no private key configured');
    }

    // 6. Log the request with payment and settlement status
    const startTime = Date.now();
    const logEntry = await db.insert(apiLogs).values({
      serviceId: service[0].id,
      requestMethod: req.method,
      requestPath: requestPath,
      requestHeaders: JSON.stringify(req.headers),
      requestBody: req.body ? JSON.stringify(req.body) : null,
      clientIp: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      paymentStatus: paymentStatus,
      paymentAmount: parseFloat(paymentPayload.amount),
      transactionHash: paymentPayload.transactionHash,
      settlementStatus: settlementStatus,
      settlementTxHash: settlementTxHash,
      settlementError: settlementError
    }).returning({ id: apiLogs.id });

    // 7. Payment verified and settled - proceed to request forwarding (step 7)
    console.log(`[Proxy] Payment verified and settled, forwarding to backend: ${service[0].originalUrl}${requestPath}`);

    // Extract request body
    const requestBody = extractRequestBody(req);

    // Forward request to original backend
    const forwardResponse = await forwardRequest({
      originalUrl: service[0].originalUrl,
      requestPath: requestPath,
      method: req.method,
      headers: req.headers,
      body: requestBody,
      timeout: 30000 // 30 second timeout
    });

    // Update log entry with response details
    const processingTime = Date.now() - startTime;

    // Note: Database update moved to end to avoid blocking response

    // Prepare settlement response headers (step 12 in diagram)
    const settlementHeaders = {};

    if (settlementTxHash) {
      settlementHeaders['X-Payment-Response'] = JSON.stringify({
        status: 'settled',
        transactionHash: settlementTxHash,
        settlementTime: new Date().toISOString()
      });
    }

    // Add proxy metadata headers
    settlementHeaders['X-Proxy-Service'] = service[0].title || 'Unknown';
    settlementHeaders['X-Proxy-Payment-Status'] = paymentStatus;
    settlementHeaders['X-Proxy-Settlement-Status'] = settlementStatus;

    // Send the forwarded response back to client (step 12)
    sendForwardedResponse(res, forwardResponse, settlementHeaders);

    console.log(`[Proxy] Request completed: ${forwardResponse.status} (${processingTime}ms total, ${forwardResponse.duration}ms backend)`);
    console.log(`[Proxy] Payment: ${paymentStatus}, Settlement: ${settlementStatus}`);

    // Update log entry with response details in background (don't await to avoid blocking response)
    db.update(apiLogs)
      .set({
        responseStatus: forwardResponse.status,
        responseHeaders: JSON.stringify(forwardResponse.headers),
        responseBody: typeof forwardResponse.body === 'string'
          ? forwardResponse.body.substring(0, 10000) // Limit response body size
          : JSON.stringify(forwardResponse.body).substring(0, 10000),
        processingTimeMs: processingTime
      })
      .where(eq(apiLogs.id, logEntry[0].id))
      .catch(err => console.error('[Proxy] Failed to update log:', err));

  } catch (error) {
    console.error('Proxy handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}