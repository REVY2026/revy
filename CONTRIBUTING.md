# Contributing to Revy

Thank you for your interest in contributing to Revy.

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/REVY2026/revy.git
   cd revy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run tests:
   ```bash
   npm test
   ```

4. Run benchmarks:
   ```bash
   npm run benchmark
   ```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Write or update tests
4. Run the test suite
5. Submit a pull request

## Code Style

- TypeScript strict mode
- No `any` types in public APIs
- Functions should have JSDoc comments
- Use conventional commit messages

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `refactor:` — code restructuring
- `test:` — adding or updating tests
- `docs:` — documentation changes
- `perf:` — performance improvements
- `chore:` — maintenance tasks

## Areas for Contribution

- New chain integrations in `src/graph.ts`
- Algorithm improvements in `src/levy-flight.ts`
- Additional benchmark scenarios
- Documentation improvements
- Test coverage

## Reporting Issues

Use GitHub Issues. Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node version, OS)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
