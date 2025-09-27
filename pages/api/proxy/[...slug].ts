import { NextApiRequest, NextApiResponse } from 'next';
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
  createX402PaymentRequirements,
  create402Response
} from '../../../src/lib/x402-facilitator';
import {
  forwardRequest,
  sendForwardedResponse,
  extractRequestBody,
  validateProxyUrl
} from '../../../src/lib/proxy-forward';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    console.log('[Proxy] Request headers:', Object.keys(req.headers));
    console.log('[Proxy] X-Payment header:', req.headers['x-payment']);

    const xPaymentHeader = req.headers['x-payment'] as string;
    let paymentStatus = 'pending';
    let paymentError = null;

    if (!xPaymentHeader) {
      console.log('[Proxy] No X-Payment header found, returning 402');

      // Create x402-compliant response using the real x402 library
      const x402PaymentRequirements = [createX402PaymentRequirements(
        `$${service[0].pricePerRequest}`,
        service[0].network,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${proxySlug}`,
        `Payment for ${service[0].title} API access`
      )];

      const response = create402Response(
        'Payment Required',
        x402PaymentRequirements
      );

      return res.status(response.status).json(response.body);
    }

    // Payment header exists - verify it using real x402 facilitator
    console.log('[Proxy] X-Payment header found, verifying payment...');
    let x402PaymentRequirements;
    let decodedPayment;

    try {
      // Create x402 payment requirements array (note: it expects an array)
      x402PaymentRequirements = [createX402PaymentRequirements(
        `$${service[0].pricePerRequest}`, // Convert to price format expected by x402
        service[0].network,
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${proxySlug}`,
        `Payment for ${service[0].title} API access`
      )];

      console.log('[Proxy] Verifying payment with facilitator...');
      // Verify payment using real x402 facilitator (expects payment header string and requirements array)
      const verification = await verifyX402Payment(
        xPaymentHeader,
        x402PaymentRequirements
      );

      console.log('[Proxy] Verification result:', verification);

      if (!verification.isValid) {
        paymentStatus = 'failed';
        paymentError = verification.invalidReason;

        // Use x402 create402Response helper
        const errorResponse = create402Response(
          verification.invalidReason,
          x402PaymentRequirements,
          verification.payer
        );

        return res.status(errorResponse.status).json(errorResponse.body);
      }

      paymentStatus = 'verified';
      decodedPayment = verification.decodedPayment;
    } catch (conversionError) {
      console.error('[Proxy] Payment conversion error:', conversionError);
      paymentStatus = 'failed';
      paymentError = `Payment format error: ${conversionError.message}`;

      const errorResponse = create402Response(
        conversionError.message,
        x402PaymentRequirements || []
      );

      return res.status(errorResponse.status).json(errorResponse.body);
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
          decodedPayment,
          x402PaymentRequirements[0] // settleX402Payment expects single requirement, not array
        );

        if (settlementResult.success) {
          settlementStatus = 'settled';
          settlementTxHash = settlementResult.responseHeader;
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
      requestHeaders: JSON.stringify(req.headers || {}),
      requestBody: req.body ? JSON.stringify(req.body) : null,
      clientIp: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      paymentStatus: paymentStatus,
      paymentAmount: decodedPayment?.payload?.authorization?.value ? parseFloat(decodedPayment.payload.authorization.value) / 100 : 0,
      transactionHash: null, // x402 uses authorization, not direct transaction hash
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

    console.log('[Proxy] Backend API Response:');
    console.log('  Status:', forwardResponse.status);
    console.log('  Success:', forwardResponse.success);
    console.log('  Duration:', forwardResponse.duration, 'ms');
    console.log('  Body:', JSON.stringify(forwardResponse.body, null, 2));
    console.log('  Headers:', forwardResponse.headers);

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