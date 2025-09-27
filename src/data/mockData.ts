import { Chain, Project, Endpoint } from '@/types';

export const mockChains: Chain[] = [
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://etherscan.io'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpcUrl: 'https://polygon-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://polygonscan.com'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'OP',
    chainId: 10,
    rpcUrl: 'https://opt-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://optimistic.etherscan.io'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ARB',
    chainId: 42161,
    rpcUrl: 'https://arb1-mainnet.g.alchemy.com/v2/',
    explorerUrl: 'https://arbiscan.io'
  },
  {
    id: 'base',
    name: 'Base',
    symbol: 'BASE',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org'
  }
];

export const mockEndpoints: Endpoint[] = [
  {
    id: 'ep1',
    projectId: 'proj1',
    name: 'Primary RPC',
    url: 'https://eth-mainnet.g.alchemy.com/v2/abc123',
    settleWhen: 'before',
    status: 'active',
    requestCount: 15420,
    avgLatency: 145,
    successRate: 99.8,
    lastRequest: new Date('2024-01-20T10:30:00Z'),
    createdAt: new Date('2024-01-15T08:00:00Z')
  },
  {
    id: 'ep2',
    projectId: 'proj1',
    name: 'Backup RPC',
    url: 'https://eth-mainnet.infura.io/v3/def456',
    settleWhen: 'before',
    status: 'active',
    requestCount: 8920,
    avgLatency: 178,
    successRate: 99.5,
    lastRequest: new Date('2024-01-20T10:25:00Z'),
    createdAt: new Date('2024-01-15T08:15:00Z')
  },
  {
    id: 'ep3',
    projectId: 'proj2',
    name: 'Polygon Main',
    url: 'https://polygon-mainnet.g.alchemy.com/v2/ghi789',
    settleWhen: 'before',
    status: 'active',
    requestCount: 12800,
    avgLatency: 120,
    successRate: 99.9,
    lastRequest: new Date('2024-01-20T10:28:00Z'),
    createdAt: new Date('2024-01-18T14:30:00Z')
  },
  {
    id: 'ep4',
    projectId: 'proj3',
    name: 'Optimism RPC',
    url: 'https://opt-mainnet.g.alchemy.com/v2/jkl012',
    settleWhen: 'before',
    status: 'error',
    requestCount: 2340,
    avgLatency: 250,
    successRate: 87.3,
    lastRequest: new Date('2024-01-20T09:45:00Z'),
    createdAt: new Date('2024-01-19T16:20:00Z')
  }
];

export const mockProjects: Project[] = [
  {
    id: 'proj1',
    name: 'DeFi Dashboard',
    description: 'Main application endpoints for our DeFi trading dashboard with real-time data feeds.',
    walletAddress: '0x1111111111111111111111111111111111111111',
    chain: [mockChains[0]], // Ethereum
    endpoints: mockEndpoints.filter(ep => ep.projectId === 'proj1'),
    totalRequests: 24340,
    avgLatency: 161,
    successRate: 99.65,
    createdAt: new Date('2024-01-15T08:00:00Z'),
    updatedAt: new Date('2024-01-20T10:30:00Z')
  },
  {
    id: 'proj2',
    name: 'Multi-Chain NFT Marketplace',
    description: 'Cross-chain NFT marketplace supporting multiple networks for broader asset compatibility.',
    walletAddress: '0x2222222222222222222222222222222222222222',
    chain: [mockChains[1], mockChains[4]], // Polygon + Base
    endpoints: mockEndpoints.filter(ep => ep.projectId === 'proj2'),
    totalRequests: 12800,
    avgLatency: 120,
    successRate: 99.9,
    createdAt: new Date('2024-01-18T14:30:00Z'),
    updatedAt: new Date('2024-01-20T10:28:00Z')
  },
  {
    id: 'proj3',
    name: 'Cross-Chain Gaming Platform',
    description: 'Multi-chain gaming infrastructure supporting Ethereum L2s for scalability and cost efficiency.',
    walletAddress: '0x3333333333333333333333333333333333333333',
    chain: [mockChains[2], mockChains[3]], // Optimism + Arbitrum
    endpoints: mockEndpoints.filter(ep => ep.projectId === 'proj3'),
    totalRequests: 2340,
    avgLatency: 250,
    successRate: 87.3,
    createdAt: new Date('2024-01-19T16:20:00Z'),
    updatedAt: new Date('2024-01-20T09:45:00Z')
  },
  {
    id: 'proj4',
    name: 'Universal Web3 API',
    description: 'Comprehensive Web3 API supporting all major blockchain networks for maximum compatibility.',
    walletAddress: '0x4444444444444444444444444444444444444444',
    chain: [mockChains[0], mockChains[1], mockChains[2]], // Ethereum + Polygon + Optimism
    endpoints: [],
    totalRequests: 50000,
    avgLatency: 180,
    successRate: 98.5,
    createdAt: new Date('2024-01-10T12:00:00Z'),
    updatedAt: new Date('2024-01-21T14:30:00Z')
  }
];