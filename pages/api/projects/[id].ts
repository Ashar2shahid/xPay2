import { NextApiRequest, NextApiResponse } from 'next';
import { db, projects, projectPaymentChains, projectEndpoints } from '../../../src/lib/db';
import { eq } from 'drizzle-orm';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await db.select()
      .from(projects)
      .where(eq(projects.id, id))
      .limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (req.method === 'GET') {
      const chains = await db.select()
        .from(projectPaymentChains)
        .where(eq(projectPaymentChains.projectId, id));

      const endpoints = await db.select()
        .from(projectEndpoints)
        .where(eq(projectEndpoints.projectId, id));

      return res.status(200).json({
        project: {
          ...project[0],
          paymentChains: chains.map(c => c.network),
          endpoints
        }
      });
    }

    if (req.method === 'PUT') {
      const {
        name,
        description,
        baseUrl,
        defaultPrice,
        currency,
        payTo,
        isActive
      } = req.body;

      const updateData: any = {
        updatedAt: new Date()
      };

      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description || null;

      if (baseUrl !== undefined) {
        if (!baseUrl) {
          return res.status(400).json({ error: 'baseUrl cannot be empty' });
        }
        try {
          new URL(baseUrl);
          updateData.baseUrl = baseUrl.replace(/\/$/, '');
        } catch {
          return res.status(400).json({ error: 'Invalid URL format' });
        }
      }

      if (defaultPrice !== undefined) {
        if (typeof defaultPrice !== 'number' || defaultPrice < 0) {
          return res.status(400).json({ error: 'defaultPrice must be a positive number' });
        }
        updateData.defaultPrice = defaultPrice;
      }

      if (currency !== undefined) updateData.currency = currency;

      if (payTo !== undefined) {
        if (!payTo.match(/^0x[a-fA-F0-9]{40}$/)) {
          return res.status(400).json({ error: 'payTo must be a valid Ethereum address' });
        }
        updateData.payTo = payTo;
      }

      if (isActive !== undefined) {
        updateData.isActive = Boolean(isActive);
      }

      const result = await db.update(projects)
        .set(updateData)
        .where(eq(projects.id, id))
        .returning();

      return res.status(200).json({ project: result[0] });
    }

    if (req.method === 'DELETE') {
      await db.delete(projects).where(eq(projects.id, id));

      return res.status(200).json({ message: 'Project deleted successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Project API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}