import { NextApiRequest, NextApiResponse } from 'next';
import { db, projectEndpoints } from '../../../src/lib/db';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid endpoint ID' });
    }

    if (req.method === 'GET') {
      const endpoint = await db.select()
        .from(projectEndpoints)
        .where(eq(projectEndpoints.id, id))
        .limit(1);

      if (endpoint.length === 0) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      return res.status(200).json({ endpoint: endpoint[0] });
    }

    if (req.method === 'PATCH') {
      const {
        url,
        path,
        method,
        price,
        description,
        creditsEnabled,
        minTopupAmount,
        isActive
      } = req.body;

      // Build update object with only provided fields
      const updateData: any = {
        updatedAt: new Date()
      };

      if (url !== undefined) updateData.url = url;
      if (path !== undefined) updateData.path = path;
      if (method !== undefined) updateData.method = method;
      if (price !== undefined) updateData.price = price;
      if (description !== undefined) updateData.description = description;
      if (creditsEnabled !== undefined) updateData.creditsEnabled = creditsEnabled;
      if (minTopupAmount !== undefined) updateData.minTopupAmount = minTopupAmount;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedEndpoint = await db.update(projectEndpoints)
        .set(updateData)
        .where(eq(projectEndpoints.id, id))
        .returning();

      if (updatedEndpoint.length === 0) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

      return res.status(200).json({ endpoint: updatedEndpoint[0] });
    }

    if (req.method === 'DELETE') {
      const deletedEndpoint = await db.delete(projectEndpoints)
        .where(eq(projectEndpoints.id, id))
        .returning();

      if (deletedEndpoint.length === 0) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }

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