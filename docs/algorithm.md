# Levy Flight Algorithm

## Background

Levy Flight is a random walk where step lengths follow a heavy-tailed power-law distribution. First characterized by Paul Levy in 1937, it was later found to describe optimal foraging strategies in apex predators (Viswanathan et al., Nature, 1999).

## Mathematical Foundation

Step length L is drawn from:

```
L = L_min * u^(-1/(mu-1))
```

Where:
- `u` ~ Uniform(0, 1)
- `mu` = 2.0 (Levy exponent, optimal for sparse targets)
- `L_min` = 1 (minimum step)

The distribution produces:
- Many short steps (local exploration)
- Rare long steps (cross-ecosystem leaps)

## Application to Cross-Chain Routing

### Local Hops (step < 2.5)
Select next chain from neighbors weighted by:
- Inverse cost (cheaper bridges preferred)
- Inverse distance to target (chains closer to destination preferred)

### Long-Range Leaps (step >= 2.5)
Jump to a non-adjacent chain, potentially crossing ecosystem boundaries (e.g., EVM to Solana).

## Algorithm Pseudocode

```
function findRoutes(from, to, amount):
  candidates = []
  for i in 0..300:
    path = [from]