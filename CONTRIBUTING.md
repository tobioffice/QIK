# Contributing to QIK

Thank you for your interest in contributing to QIK! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see [README.md](README.md))
4. Create a new branch for your feature/fix

## Development Workflow

### Branch Naming

- `feature/` - New features (e.g., `feature/bus-tracking`)
- `fix/` - Bug fixes (e.g., `fix/attendance-calculation`)
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

### Making Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our code style

3. **Test your changes**:
   ```bash
   npm start
   # Test on device/emulator
   ```

4. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add bus tracking feature"
   ```

### Commit Message Format

We follow [Conventional Commits](https://conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting (no code change)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Code Style

### TypeScript/React Native

- Use TypeScript for type safety
- Prefer functional components with hooks
- Use descriptive variable/function names
- Keep components focused and small

### Styling

- Use NativeWind (TailwindCSS) classes
- Follow the existing design system
- Maintain dark theme consistency

### File Organization

```
components/
├── ComponentName.tsx      # Component file
├── ComponentName.test.tsx # Tests (optional)
└── index.ts              # Barrel export
```

## Pull Requests

1. **Update your branch** with the latest main:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Open a Pull Request** with:
   - Clear title describing the change
   - Description of what and why
   - Screenshots for UI changes
   - Reference any related issues

## Reporting Issues

When reporting bugs, include:

- Device/emulator details
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Error logs from console

## Questions?

Reach out to [muraliaggipothu@gmail.com](mailto:muraliaggipothu@gmail.com) for any questions.

---

Thank you for contributing! 🎉
