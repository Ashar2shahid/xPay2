import { NextApiRequest, NextApiResponse } from 'next';
import { db, projects, projectPaymentChains, NewProjectPaymentChain } from '../../../../src/lib/db';
import { eq, and } from 'drizzle-orm';

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

      return res.status(200).json({ chains: chains.map(c => c.network) });
    }

    if (req.method === 'POST') {
      const { network } = req.body;

      if (!network) {
        return res.status(400).json({ error: 'network is required' });
      }

      const existingChain = await db.select()
        .from(projectPaymentChains)
        .where(
          and(
            eq(projectPaymentChains.projectId, id),
            eq(projectPaymentChains.network, network)
          )
        )
        .limit(1);

      if (existingChain.length > 0) {
        return res.status(400).json({ error: 'This payment chain already exists for this project' });
      }

      const newChain: NewProjectPaymentChain = {
        projectId: id,
        network,
        isActive: true,
      };

      const result = await db.insert(projectPaymentChains).values(newChain).returning();

      return res.status(201).json({ chain: result[0] });
    }

    if (req.method === 'DELETE') {
      const { network } = req.body;

      if (!network) {
        return res.status(400).json({ error: 'network is required' });
      }

      await db.delete(projectPaymentChains)
        .where(
          and(
            eq(projectPaymentChains.projectId, id),
            eq(projectPaymentChains.network, network)
          )
        );

      return res.status(200).json({ message: 'Payment chain removed successfully' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Payment chains API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}