/**
 * Input validation for route requests and engine parameters.
 */

import { RouteRequest } from './types.js';
import { ChainGraph } from './graph.js';
import { LEVY_DEFAULTS } from './config.js';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateRouteRequest(
  request: RouteRequest,
  graph: ChainGraph
): ValidationResult {
  const errors: string[] = [];

  if (!request.fromChain || typeof request.fromChain !== 'string') {
    errors.push('fromChain is required and must be a string');
  }

  if (!request.toChain || typeof request.toChain !== 'string') {
    errors.push('toChain is required and must be a string');
  }

  if (request.fromChain && request.toChain &&
      request.fromChain.toLowerCase() === request.toChain.toLowerCase()) {
    errors.push('fromChain and toChain must be different');
  }

  if (typeof request.amountUsd !== 'number' || request.amountUsd <= 0) {
    errors.push('amountUsd must be a positive number');
  }

  if (request.amountUsd > 10_000_000) {
    errors.push('amountUsd exceeds maximum supported amount ($10M)');
  }

  if (request.fromChain) {
    const chains = graph.getChains();
    const fromExists = chains.some(c =>
      c.name.toLowerCase() === request.fromChain.toLowerCase()
    );
    if (!fromExists) {
      errors.push(`fromChain "${request.fromChain}" is not a supported chain`);
    }
  }

  if (request.toChain) {
    const chains = graph.getChains();
    const toExists = chains.some(c =>
      c.name.toLowerCase() === request.toChain.toLowerCase()
    );
    if (!toExists) {
      errors.push(`toChain "${request.toChain}" is not a supported chain`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateLevyParams(params: {
  mu?: number;
  iterations?: number;
  maxHops?: number;
}): ValidationResult {
  const errors: string[] = [];

  const mu = params.mu ?? LEVY_DEFAULTS.mu;
  if (mu <= 1 || mu >= 3) {
    errors.push('mu must be between 1 and 3 (exclusive)');
  }

  const iterations = params.iterations ?? LEVY_DEFAULTS.iterations;
  if (iterations < 1 || iterations > 10000) {
    errors.push('iterations must be between 1 and 10000');
  }

  const maxHops = params.maxHops ?? LEVY_DEFAULTS.maxHops;
  if (maxHops < 1 || maxHops > 10) {
    errors.push('maxHops must be between 1 and 10');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeChainName(chain: string): string {
  return chain.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}
