import { NextApiRequest, NextApiResponse } from 'next';
import { db, proxiedServices } from '../../../src/lib/db';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const service = await db.select()
      .from(proxiedServices)
      .where(eq(proxiedServices.id, id))
      .limit(1);

    if (service.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ service: service[0] });
    }

    if (req.method === 'PUT') {
      const {
        originalUrl,
        title,
        description,
        pricePerRequest,
        currency,
        network,
        payTo,
        isActive
      } = req.body;

      const updateData: any = {
        updatedAt: new Date()
      };

      if (originalUrl !== undefined) {
        if (!originalUrl) {
          return res.status(400).json({ error: 'originalUrl cannot be empty' });
        }
        try {
          new URL(originalUrl);
          updateData.originalUrl = originalUrl.replace(/\/$/, '');
        } catch {
          return res.status(400).json({ error: 'Invalid URL format' });
        }
      }

      if (title !== undefined) updateData.title = title || null;
      if (description !== undefined) updateData.description = description || null;

      if (pricePerRequest !== undefined) {
        if (typeof pricePerRequest !== 'number' || pricePerRequest < 0) {
          return res.status(400).json({ error: 'pricePerRequest must be a positive number' });
        }
        updateData.pricePerRequest = pricePerRequest;
      }

      if (currency !== undefined) updateData.currency = currency;
      if (network !== undefined) updateData.network = network;

      if (payTo !== undefined) {
        if (!payTo.match(/^0x[a-fA-F0-9]{40}$/)) {
          return res.status(400).json({ error: 'payTo must be a valid Ethereum address' });
        }
        updateData.payTo = payTo;
      }

      if (isActive !== undefined) {
        updateData.isActive = Boolean(isActive);
      }

      const result = await db.update(proxiedServices)
        .set(updateData)
        .where(eq(proxiedServices.id, id))
        .returning();

      return res.status(200).json({ service: result[0] });
    }

    if (req.method === 'DELETE') {
      await db.delete(proxiedServices)
        .where(eq(proxiedServices.id, id));

      return res.status(200).json({ message: 'Service deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Service API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}