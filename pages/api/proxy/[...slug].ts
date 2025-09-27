import { NextApiRequest, NextApiResponse } from 'next';
import { db, projects, projectEndpoints, projectPaymentChains, apiLogs } from '../../../src/lib/db';
import { eq, and } from 'drizzle-orm';
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

function findMatchingEndpoint(endpoints: any[], path: string, method: string): any | null {
  const exactMatch = endpoints.find(e =>
    e.isActive &&
    e.path === path &&
    (e.method === method || e.method === '*')
  );

  if (exactMatch) return exactMatch;

  for (const endpoint of endpoints) {
    if (!endpoint.isActive) continue;
    if (endpoint.method !== '*' && endpoint.method !== method) continue;

    const pattern = endpoint.path.replace(/:[^/]+/g, '[^/]+');
    const regex = new RegExp(`^${pattern}$`);

    if (regex.test(path)) {
      return endpoint;
    }
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { slug } = req.query;

    if (!slug || !Array.isArray(slug) || slug.length === 0) {
      return res.status(400).json({ error: 'Invalid proxy path' });
    }

    const projectSlug = slug[0];
    const requestPath = '/' + slug.slice(1).join('/');

    const project = await db.select()
      .from(projects)
      .where(eq(projects.slug, projectSlug))
      .limit(1);

    if (!project.length || !project[0].isActive) {
      return res.status(404).json({ error: 'Project not found' });
    }


    const endpoints = await db.select()
      .from(projectEndpoints)
      .where(eq(projectEndpoints.projectId, project[0].id));

    const paymentChains = await db.select()
      .from(projectPaymentChains)
      .where(and(
        eq(projectPaymentChains.projectId, project[0].id),
        eq(projectPaymentChains.isActive, true)
      ));

    const matchingEndpoint = findMatchingEndpoint(endpoints, requestPath, req.method || 'GET');

    if (!matchingEndpoint) {
      return res.status(404).json({ error: 'Endpoint not found for this path' });
    }

    if (!validateProxyUrl(matchingEndpoint.url)) {
      return res.status(400).json({ error: 'Invalid backend URL' });
    }

    const price = matchingEndpoint.price ?? project[0].defaultPrice;
    const backendUrl = matchingEndpoint.url;
    const allowedNetworks = paymentChains.map(c => c.network);

    if (allowedNetworks.length === 0) {
      return res.status(500).json({ error: 'No payment networks configured for this project' });
    }

    console.log('[Proxy] Request headers:', Object.keys(req.headers));
    console.log('[Proxy] X-Payment header:', req.headers['x-payment']);

    const xPaymentHeader = req.headers['x-payment'] as string;
    let paymentStatus = 'pending';
    let paymentError = null;

    if (!xPaymentHeader) {
      console.log('[Proxy] No X-Payment header found, returning 402');

      const x402Requirements = allowedNetworks.map(network =>
        createX402PaymentRequirements(
          `$${price}`,
          network,
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${projectSlug}`,
          `Payment for ${project[0].name} - ${matchingEndpoint?.description || requestPath}`
        )
      );

      const response = create402Response(
        'Payment Required',
        x402Requirements
      );

      return res.status(response.status).json(response.body);
    }

    console.log('[Proxy] X-Payment header found, verifying payment...');
    let x402PaymentRequirements: any[];
    let decodedPayment: any = null;

    try {
      x402PaymentRequirements = allowedNetworks.map(network =>
        createX402PaymentRequirements(
          `$${price}`,
          network,
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${projectSlug}`,
          `Payment for ${project[0].name} - ${matchingEndpoint?.description || requestPath}`
        )
      );

      console.log('[Proxy] Verifying payment with facilitator...');
      const verification = await verifyX402Payment(
        xPaymentHeader,
        x402PaymentRequirements
      );

      console.log('[Proxy] Verification result:', verification);

      if (!verification.isValid) {
        paymentStatus = 'failed';
        paymentError = verification.invalidReason;

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

    let settlementStatus = 'pending';
    let settlementTxHash = null;
    let settlementError = null;

    const enableSettlement = process.env.ENABLE_SETTLEMENT === 'true';

    if (enableSettlement && process.env.EVM_PRIVATE_KEY) {
      try {
        console.log('[Proxy] Starting settlement phase');

        const usedNetwork = decodedPayment.network;
        const matchingRequirement = x402PaymentRequirements.find(req => req.network === usedNetwork);

        if (!matchingRequirement) {
          throw new Error(`No matching payment requirement for network: ${usedNetwork}`);
        }

        const settlementResult = await settleX402Payment(
          decodedPayment,
          matchingRequirement
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
      }
    } else {
      settlementStatus = 'disabled';
      console.log('[Proxy] Settlement disabled or no private key configured');
    }

    const startTime = Date.now();
    const logEntry = await db.insert(apiLogs).values({
      projectId: project[0].id,
      endpointId: matchingEndpoint.id,
      requestMethod: req.method,
      requestPath: requestPath,
      requestHeaders: JSON.stringify(req.headers || {}),
      requestBody: req.body ? JSON.stringify(req.body) : null,
      clientIp: req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      paymentStatus: paymentStatus,
      paymentAmount: decodedPayment?.payload?.authorization?.value ? parseFloat(decodedPayment.payload.authorization.value) / 100 : 0,
      transactionHash: null,
      settlementStatus: settlementStatus,
      settlementTxHash: settlementTxHash,
      settlementError: settlementError
    }).returning({ id: apiLogs.id });

    console.log(`[Proxy] Payment verified and settled, forwarding to backend: ${backendUrl}${matchingEndpoint.path}`);

    const requestBody = extractRequestBody(req);

    const forwardResponse = await forwardRequest({
      originalUrl: backendUrl,
      requestPath: matchingEndpoint.path,
      method: req.method,
      headers: req.headers,
      body: requestBody,
      timeout: 30000
    });

    console.log('[Proxy] Backend API Response:');
    console.log('  Status:', forwardResponse.status);
    console.log('  Success:', forwardResponse.success);
    console.log('  Duration:', forwardResponse.duration, 'ms');
    console.log('  Body:', JSON.stringify(forwardResponse.body, null, 2));
    console.log('  Headers:', forwardResponse.headers);

    const processingTime = Date.now() - startTime;

    const settlementHeaders = {};

    if (settlementTxHash) {
      settlementHeaders['X-Payment-Response'] = JSON.stringify({
        status: 'settled',
        transactionHash: settlementTxHash,
        settlementTime: new Date().toISOString()
      });
    }

    settlementHeaders['X-Proxy-Project'] = project[0].name;
    settlementHeaders['X-Proxy-Payment-Status'] = paymentStatus;
    settlementHeaders['X-Proxy-Settlement-Status'] = settlementStatus;

    sendForwardedResponse(res, forwardResponse, settlementHeaders);

    console.log(`[Proxy] Request completed: ${forwardResponse.status} (${processingTime}ms total, ${forwardResponse.duration}ms backend)`);
    console.log(`[Proxy] Payment: ${paymentStatus}, Settlement: ${settlementStatus}`);

    db.update(apiLogs)
      .set({
        responseStatus: forwardResponse.status,
        responseHeaders: JSON.stringify(forwardResponse.headers),
        responseBody: typeof forwardResponse.body === 'string'
          ? forwardResponse.body.substring(0, 10000)
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