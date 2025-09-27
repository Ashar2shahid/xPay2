import { NextApiRequest, NextApiResponse } from 'next';
import { db, proxiedServices, NewProxiedService } from '../../../src/lib/db';
import { eq } from 'drizzle-orm';

function generateSlug(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/\./g, '-');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${hostname}-${randomSuffix}`;
  } catch {
    const randomSuffix = Math.random().toString(36).substring(2, 12);
    return `service-${randomSuffix}`;
  }
}

function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const services = await db.select().from(proxiedServices);
      return res.status(200).json({ services });
    }

    if (req.method === 'POST') {
      const {
        originalUrl,
        title,
        description,
        pricePerRequest,
        currency = 'USD',
        network = 'base',
        payTo,
        proxySlug
      } = req.body;

      if (!originalUrl) {
        return res.status(400).json({ error: 'originalUrl is required' });
      }

      const urlValidation = validateUrl(originalUrl);
      if (!urlValidation.valid) {
        return res.status(400).json({ error: urlValidation.error });
      }

      if (pricePerRequest === undefined || pricePerRequest === null) {
        return res.status(400).json({ error: 'pricePerRequest is required' });
      }

      if (typeof pricePerRequest !== 'number' || pricePerRequest < 0) {
        return res.status(400).json({ error: 'pricePerRequest must be a positive number' });
      }

      if (!payTo) {
        return res.status(400).json({ error: 'payTo address is required' });
      }

      if (!payTo.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: 'payTo must be a valid Ethereum address' });
      }

      const slug = proxySlug || generateSlug(originalUrl);

      const existingService = await db.select()
        .from(proxiedServices)
        .where(eq(proxiedServices.proxySlug, slug))
        .limit(1);

      if (existingService.length > 0) {
        return res.status(400).json({ error: 'Proxy slug already exists. Please choose a different slug.' });
      }

      const newService: NewProxiedService = {
        originalUrl: originalUrl.replace(/\/$/, ''),
        proxySlug: slug,
        title: title || null,
        description: description || null,
        pricePerRequest,
        currency,
        network,
        payTo,
        isActive: true,
      };

      const result = await db.insert(proxiedServices).values(newService).returning();

      return res.status(201).json({
        service: result[0],
        proxyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${slug}`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Services API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}