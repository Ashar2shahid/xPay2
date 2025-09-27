import { NextApiRequest, NextApiResponse } from 'next';
import { db, projectEndpoints } from '../../../../../src/lib/db';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { endpointId } = req.query;

    if (!endpointId || typeof endpointId !== 'string') {
      return res.status(400).json({ error: 'Invalid endpoint ID' });
    }

    const endpoint = await db.select()
      .from(projectEndpoints)
      .where(eq(projectEndpoints.id, endpointId))
      .limit(1);

    if (endpoint.length === 0) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    if (req.method === 'GET') {
      return res.status(200).json({ endpoint: endpoint[0] });
    }

    if (req.method === 'PUT') {
      const { path, method, price, description, isActive } = req.body;

      const updateData: any = {
        updatedAt: new Date()
      };

      if (path !== undefined) {
        if (!path) {
          return res.status(400).json({ error: 'path cannot be empty' });
        }
        updateData.path = path;
      }

      if (method !== undefined) updateData.method = method;

      if (price !== undefined) {
        if (price !== null && (typeof price !== 'number' || price < 0)) {
          return res.status(400).json({ error: 'price must be a positive number or null' });
        }
        updateData.price = price;
      }

      if (description !== undefined) updateData.description = description || null;
      if (isActive !== undefined) updateData.isActive = Boolean(isActive);

      const result = await db.update(projectEndpoints)
        .set(updateData)
        .where(eq(projectEndpoints.id, endpointId))
        .returning();

      return res.status(200).json({ endpoint: result[0] });
    }

    if (req.method === 'DELETE') {
      await db.delete(projectEndpoints).where(eq(projectEndpoints.id, endpointId));

      return res.status(200).json({ message: 'Endpoint deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Endpoint API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}