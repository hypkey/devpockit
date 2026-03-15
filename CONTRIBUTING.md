# Contributing to DevPockit

Thank you for your interest in contributing to DevPockit! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Project Structure](#project-structure)
- [Adding New Tools](#adding-new-tools)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Getting Help](#getting-help)

## 📜 Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18+ (recommended: Node.js 20+)
- **pnpm**: Version 8+ (package manager)
- **Git**: Latest version

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/devpockit.git
   cd devpockit
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/hypkey/devpockit.git
   ```

## 🛠️ Development Setup

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. (Optional) Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Note: Environment variables are optional for local development.

### Running the Development Server

```bash
# Start the development server
pnpm dev

# The application will be available at:
# http://localhost:3000 (or 3001 if 3000 is busy)
```

The development server includes:
- Hot module replacement (HMR)
- Fast refresh for React components
- TypeScript type checking
- ESLint error reporting

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run tests for CI
pnpm test:ci
```

### Code Quality Checks

```bash
# Run ESLint
pnpm lint

# Fix ESLint issues automatically
pnpm lint:fix

# Run TypeScript type checking
pnpm type-check

# Format code with Prettier
pnpm format

# Check code formatting
pnpm format:check
```

### Building for Production

```bash
# Build the application
pnpm build

# Start production server
pnpm start

# Preview production build locally
pnpm preview
```

## 🔄 Development Workflow

### Branch Naming Convention

Create branches using the following naming conventions:

- **Features**: `feature/description-of-feature`
  - Example: `feature/add-base64-encoder`
- **Bug fixes**: `fix/description-of-bug`
  - Example: `fix/json-formatter-error-handling`
- **Documentation**: `docs/description-of-docs`
  - Example: `docs/update-contributing-guide`
- **Refactoring**: `refactor/description-of-refactor`
  - Example: `refactor/tool-component-structure`
- **Performance**: `perf/description-of-improvement`
  - Example: `perf/optimize-bundle-size`

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```bash
feat(json-formatter): add syntax highlighting support

fix(uuid-generator): handle edge case for v1 UUIDs

docs(readme): update installation instructions

refactor(tools): extract common tool logic to shared utilities
```

### Branching Model

This project uses a two-branch model:

| Branch | Purpose |
|--------|---------|
| `main` | Production only — updated exclusively by release PRs. Always stable. |
| `develop` | Active development — feature branches merge here. |

Fork users who sync `main` will always get released, stable code.

### Pull Request Process

1. **Update your fork:**
   ```bash
   git checkout develop
   git pull upstream develop
   git push origin develop
   ```

2. **Create a feature branch from `develop`:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Write clean, well-documented code
   - Follow coding standards
   - Add tests for new features
   - Update documentation as needed

4. **Test your changes:**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test
   pnpm build
   ```

5. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: your descriptive commit message"
   ```

6. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request targeting `develop`:**
   - Go to the GitHub repository
   - Click "New Pull Request"
   - Set **base** to `develop` (not `main`)
   - Select your branch
   - Fill out the PR template
   - Link any related issues
   - Request review from maintainers

8. **Respond to feedback:**
   - Address review comments
   - Make requested changes
   - Update the PR as needed

## 📝 Coding Standards

### TypeScript

- **Strict Mode**: Enabled for type safety
- **Type Definitions**: Prefer proper typing for functions and components
- **Any Types**: `any` types are allowed when necessary, but prefer specific types when possible
- **Interfaces**: Use interfaces for object shapes
- **Types**: Use types for unions, intersections, and complex types

**Preferred:**
```typescript
interface ToolResult {
  success: boolean;
  data?: string;
  error?: string;
}

function formatJson(input: string): ToolResult {
  // Implementation
}
```

**Acceptable (when needed):**
```typescript
function formatJson(input: any): any {
  // Implementation - use when type is truly unknown or dynamic
}
```

### React Components

- **Functional Components**: Use functional components with hooks
- **Component Structure**: Follow this order:
  1. Imports
  2. Types/Interfaces
  3. Component definition
  4. Exports

**Example:**
```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface JsonFormatterProps {
  onResult: (result: string) => void;
  onError: (error: string) => void;
}

export function JsonFormatter({ onResult, onError }: JsonFormatterProps) {
  const [input, setInput] = useState('');

  // Component logic

  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### File Naming Conventions

- **Component files**: PascalCase (e.g., `JsonFormatter.tsx`, `UserProfile.tsx`)
- **UI component files**: kebab-case (shadcn/ui convention, e.g., `button.tsx`, `input.tsx`)
- **Route folders**: kebab-case/lowercase (e.g., `user-profile/`, `api/`)
- **Route files**: lowercase special files (`page.tsx`, `layout.tsx`, `route.ts`)
- **Utility/config files**: kebab-case or camelCase (e.g., `utils.ts`, `api-config.ts`)
- **Hook files**: camelCase (e.g., `useMobile.tsx`, `useMonacoEditor.ts`)

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for JSX, single quotes for JavaScript (or follow Prettier)
- **Semicolons**: Use semicolons
- **Line Length**: Maximum 100 characters (Prettier will handle this)
- **Trailing Commas**: Use trailing commas in multi-line objects/arrays

### Imports

- **Absolute Imports**: Use path aliases (`@/components`, `@/libs`, etc.)
- **Import Order**:
  1. External dependencies
  2. Internal absolute imports
  3. Relative imports
  4. Type imports (use `import type`)

**Example:**
```typescript
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { formatJson } from '@/libs/json-formatter';
import type { ToolResult } from '@/types/tools';
```

### Comments and Documentation

- **JSDoc**: Use JSDoc for public APIs and complex functions
- **Inline Comments**: Explain "why", not "what"
- **TODO Comments**: Use `// TODO: description` for future improvements

**Example:**
```typescript
/**
 * Formats JSON string with optional minification.
 *
 * @param input - The JSON string to format
 * @param minify - Whether to minify the output
 * @returns Formatted or minified JSON string
 * @throws {Error} If input is not valid JSON
 */
export function formatJson(input: string, minify: boolean = false): string {
  // Implementation
}
```

## 📁 Project Structure

```
devpockit/
├── src/
│   ├── app/                  # Next.js 15 App Router
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/           # React components
│   │   ├── ui/              # Shadcn/ui components
│   │   ├── tools/           # Tool-specific components
│   │   ├── layout/           # Layout components
│   │   └── pages/           # Page components
│   ├── libs/                # Utility functions and tool logic
│   ├── config/              # Tool configurations
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
├── .github/                 # GitHub templates and workflows
├── docs/                    # Documentation
└── scripts/                 # Build and utility scripts
```

### Key Directories

- **`src/app/`**: Next.js App Router pages and layouts
- **`src/components/ui/`**: Reusable UI components (Shadcn/ui)
- **`src/components/tools/`**: Tool-specific React components
- **`src/libs/`**: Core tool logic and utilities
- **`src/config/`**: Tool configuration files
- **`src/hooks/`**: Custom React hooks
- **`src/types/`**: Shared TypeScript types

## 🛠️ Adding New Tools

To add a new developer tool to DevPockit:

1. **Create tool logic** in `src/libs/`:
   ```typescript
   // src/libs/your-tool.ts
   export function processYourTool(input: string): string {
     // Tool logic
   }
   ```

2. **Create tool configuration** in `src/config/`:
   ```typescript
   // src/config/your-tool-config.ts
   export const yourToolConfig = {
     id: 'your-tool',
     name: 'Your Tool',
     category: 'utilities',
     // ... other config
   };
   ```

3. **Create tool component** in `src/components/tools/`:
   ```typescript
   // src/components/tools/YourTool.tsx
   export function YourTool() {
     // Component implementation
   }
   ```

4. **Add tool to tools data** in `src/libs/tools-data.ts`

5. **Create route** in `src/app/tools/[category]/[toolId]/page.tsx` (if needed)

6. **Write tests** in `__tests__/` directory

7. **Update documentation**:
   - Add to README.md
   - Update CHANGELOG.md
   - Add usage examples

## 🧪 Testing Guidelines

### Test Structure

- **Unit Tests**: Test individual functions and utilities
- **Component Tests**: Test React components in isolation
- **Integration Tests**: Test tool workflows end-to-end

### Writing Tests

```typescript
// __tests__/libs/json-formatter.test.ts
import { formatJson } from '@/libs/json-formatter';

describe('formatJson', () => {
  it('should format valid JSON', () => {
    const input = '{"name":"test"}';
    const result = formatJson(input, false);
    expect(result).toBe('{\n  "name": "test"\n}');
  });

  it('should handle invalid JSON', () => {
    const input = 'invalid json';
    expect(() => formatJson(input, false)).toThrow();
  });
});
```

### Test Requirements

- **Coverage**: Aim for 80%+ code coverage
- **Test Names**: Use descriptive test names
- **Test Organization**: Group related tests with `describe` blocks
- **Assertions**: Use appropriate matchers

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run specific test file
pnpm test json-formatter.test.ts
```

## 📚 Documentation

### Code Documentation

- **JSDoc**: Document all public functions and components
- **Type Definitions**: Document complex types and interfaces
- **README Comments**: Add comments for complex logic

### Project Documentation

- **README.md**: Keep installation and usage instructions updated
- **CHANGELOG.md**: Document all changes in each release
- **API Documentation**: Document tool APIs if applicable

### Documentation Updates

When adding features:
- Update README.md if adding new tools or features
- Update CHANGELOG.md with your changes
- Add JSDoc comments to new functions
- Update relevant documentation files

## ✅ Submitting Changes

### Before Submitting

Ensure your code:

- [ ] Follows coding standards
- [ ] Passes all tests (`pnpm test`)
- [ ] Passes linting (`pnpm lint`)
- [ ] Passes type checking (`pnpm type-check`)
- [ ] Builds successfully (`pnpm build`)
- [ ] Includes tests for new features
- [ ] Updates documentation as needed
- [ ] Follows commit message conventions
- [ ] Updates CHANGELOG.md (if applicable)

### Pull Request Checklist

When creating a PR:

- [ ] Descriptive title and description
- [ ] Links to related issues
- [ ] Screenshots (for UI changes)
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Follows PR template

### Review Process

1. **Automated Checks**: CI will run tests and linting
2. **Code Review**: Maintainers will review your code
3. **Feedback**: Address any requested changes
4. **Approval**: Once approved, your PR will be merged

## 🆘 Getting Help

### Questions and Discussions

- **GitHub Discussions**: Use for questions and general discussions
- **GitHub Issues**: Use for bug reports and feature requests
- **Security Issues**: Report to [security@example.com] (use private reporting)

### Resources

- **Documentation**: Check README.md and docs/ directory
- **Examples**: Look at existing tools for reference
- **Code**: Review similar implementations in the codebase

### Communication

- Be respectful and professional
- Provide context when asking questions
- Search existing issues/discussions before creating new ones
- Be patient - maintainers are volunteers

## 🎉 Recognition

Contributors will be:

- Listed in the project's contributors
- Credited in release notes
- Appreciated by the community!

Thank you for contributing to DevPockit! 🚀

