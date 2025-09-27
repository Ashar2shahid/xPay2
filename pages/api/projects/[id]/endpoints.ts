import { NextApiRequest, NextApiResponse } from 'next';
import { db, projects, projectEndpoints, NewProjectEndpoint } from '../../../../src/lib/db';
import { eq, and } from 'drizzle-orm';

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
      const endpoints = await db.select()
        .from(projectEndpoints)
        .where(eq(projectEndpoints.projectId, id));

      const projectSlug = project[0].slug;
      const endpointsWithProxyUrl = endpoints.map(endpoint => ({
        ...endpoint,
        proxyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${projectSlug}${endpoint.path}`
      }));

      return res.status(200).json({ endpoints: endpointsWithProxyUrl });
    }

    if (req.method === 'POST') {
      const { url, path = '', method = '*', headers, body, params, price, description } = req.body;

      if (!url) {
        return res.status(400).json({ error: 'url is required' });
      }

      const urlValidation = validateUrl(url);
      if (!urlValidation.valid) {
        return res.status(400).json({ error: urlValidation.error });
      }

      if (price !== undefined && price !== null) {
        if (typeof price !== 'number' || price < 0) {
          return res.status(400).json({ error: 'price must be a positive number' });
        }
      }

      const newEndpoint: NewProjectEndpoint = {
        projectId: id,
        url,
        path,
        method,
        headers: headers ? JSON.stringify(headers) : null,
        body: body ? JSON.stringify(body) : null,
        params: params ? JSON.stringify(params) : null,
        price: price || null,
        description: description || null,
        isActive: true,
      };

      const result = await db.insert(projectEndpoints).values(newEndpoint).returning();

      const projectSlug = project[0].slug;
      return res.status(201).json({
        endpoint: {
          ...result[0],
          proxyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/proxy/${projectSlug}${result[0].path}`
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Endpoints API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}