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
