import { NextApiRequest, NextApiResponse } from 'next';
import { db, projects, projectPaymentChains, projectEndpoints, NewProject, NewProjectPaymentChain, NewProjectEndpoint } from '../../../src/lib/db';
import { eq } from 'drizzle-orm';

function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
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
      const allProjects = await db.select().from(projects);

      const projectsWithDetails = await Promise.all(
        allProjects.map(async (project) => {
          const chains = await db.select()
            .from(projectPaymentChains)
            .where(eq(projectPaymentChains.projectId, project.id));

          const endpoints = await db.select()
            .from(projectEndpoints)
            .where(eq(projectEndpoints.projectId, project.id));

          return {
            ...project,
            paymentChains: chains.map(c => c.network),
            endpoints: endpoints.map(e => ({
              id: e.id,
              url: e.url,
              path: e.path,
              method: e.method,
              price: e.price,
              description: e.description,
              isActive: e.isActive,
              proxyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${project.slug}${e.path}`
            })),
            proxyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${project.slug}`
          };
        })
      );

      return res.status(200).json({ projects: projectsWithDetails });
    }

    if (req.method === 'POST') {
      const {
        name,
        description,
        defaultPrice,
        currency = 'USD',
        payTo,
        paymentChains = [],
        endpoints = [],
        slug: customSlug
      } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'name is required' });
      }

      if (defaultPrice === undefined || defaultPrice === null) {
        return res.status(400).json({ error: 'defaultPrice is required' });
      }

      if (typeof defaultPrice !== 'number' || defaultPrice < 0) {
        return res.status(400).json({ error: 'defaultPrice must be a positive number' });
      }

      if (!payTo) {
        return res.status(400).json({ error: 'payTo address is required' });
      }

      if (!payTo.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({ error: 'payTo must be a valid Ethereum address' });
      }

      if (!Array.isArray(paymentChains) || paymentChains.length === 0) {
        return res.status(400).json({ error: 'At least one payment chain is required' });
      }

      const slug = customSlug || generateSlug(name);

      const existingProject = await db.select()
        .from(projects)
        .where(eq(projects.slug, slug))
        .limit(1);

      if (existingProject.length > 0) {
        return res.status(400).json({ error: 'Project slug already exists. Please choose a different name or slug.' });
      }

      const newProject: NewProject = {
        name,
        slug,
        description: description || null,
        defaultPrice,
        currency,
        payTo,
        isActive: true,
      };

      const [createdProject] = await db.insert(projects).values(newProject).returning();

      const chainRecords: NewProjectPaymentChain[] = paymentChains.map((network: string) => ({
        projectId: createdProject.id,
        network,
        isActive: true,
      }));

      await db.insert(projectPaymentChains).values(chainRecords);

      if (Array.isArray(endpoints) && endpoints.length > 0) {
        for (const endpoint of endpoints) {
          if (!endpoint.url) {
            return res.status(400).json({ error: 'Each endpoint must have a url' });
          }
          const urlValidation = validateUrl(endpoint.url);
          if (!urlValidation.valid) {
            return res.status(400).json({ error: `Invalid endpoint URL: ${urlValidation.error}` });
          }
        }

        const endpointRecords: NewProjectEndpoint[] = endpoints.map((endpoint: any) => ({
          projectId: createdProject.id,
          url: endpoint.url,
          path: endpoint.path || '',
          method: endpoint.method || '*',
          headers: endpoint.headers ? JSON.stringify(endpoint.headers) : null,
          body: endpoint.body ? JSON.stringify(endpoint.body) : null,
          params: endpoint.params ? JSON.stringify(endpoint.params) : null,
          price: endpoint.price || null,
          description: endpoint.description || null,
          isActive: true,
        }));

        await db.insert(projectEndpoints).values(endpointRecords);
      }

      const insertedChains = await db.select()
        .from(projectPaymentChains)
        .where(eq(projectPaymentChains.projectId, createdProject.id));

      const insertedEndpoints = await db.select()
        .from(projectEndpoints)
        .where(eq(projectEndpoints.projectId, createdProject.id));

      return res.status(201).json({
        project: {
          ...createdProject,
          paymentChains: insertedChains.map(c => c.network),
          endpoints: insertedEndpoints
        },
        proxyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${slug}`
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Projects API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}