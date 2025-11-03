# Contributing to YunSeeAI

Thank you for your interest in contributing to YunSeeAI! This document provides guidelines and instructions for contributing.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Submitting Changes](#submitting-changes)
6. [Reporting Issues](#reporting-issues)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them get started
- Accept constructive criticism gracefully
- Focus on what is best for the community

### Unacceptable Behavior

- Harassment or discriminatory language
- Trolling or inflammatory comments
- Personal or political attacks
- Publishing others' private information

---

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- Git
- TypeScript knowledge
- Basic understanding of AI/LLMs (helpful but not required)

### Setting Up Development Environment

1. **Fork the repository**

```bash
# Click "Fork" on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/yunsee-ai.git
cd yunsee-ai
```

2. **Install dependencies**

```bash
npm install
```

3. **Download a model** (for testing)

```bash
# Place a GGUF model in project root
# See docs/SETUP.md for model recommendations
```

4. **Build the project**

```bash
npm run build
```

5. **Run in development mode**

```bash
npm run dev
```

---

## Development Workflow

### Branching Strategy

- `main` - Stable production code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### Making Changes

1. Make your changes in the feature branch
2. Write/update tests as needed
3. Update documentation
4. Test thoroughly
5. Commit with clear messages

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add vulnerability scanner module
fix: resolve memory leak in model server
docs: update installation guide
refactor: improve CLI command parsing
test: add tests for AssistantService
```

Examples:

```bash
git commit -m "feat: implement port scanning functionality"
git commit -m "fix: handle model loading timeout"
git commit -m "docs: add architecture diagram"
```

### Testing Your Changes

```bash
# Build the project
npm run build

# Run the CLI
npm start

# Test specific features
npm run dev
```

---

## Coding Standards

### TypeScript Guidelines

1. **Use TypeScript strictly**
   ```typescript
   // Good
   function greet(name: string): string {
     return `Hello, ${name}`;
   }
   
   // Bad
   function greet(name: any): any {
     return `Hello, ${name}`;
   }
   ```

2. **Prefer interfaces over types**
   ```typescript
   // Good
   interface User {
     name: string;
     age: number;
   }
   
   // Acceptable for unions/intersections
   type Status = 'active' | 'inactive';
   ```

3. **Use async/await**
   ```typescript
   // Good
   async function fetchData(): Promise<Data> {
     const result = await api.call();
     return result;
   }
   
   // Avoid
   function fetchData(): Promise<Data> {
     return api.call().then(result => result);
   }
   ```

### Code Style

- **Indentation**: 2 spaces
- **Line length**: Max 100 characters
- **Semicolons**: Required
- **Quotes**: Single quotes for strings
- **Trailing commas**: Yes

Example:

```typescript
export class ModelServer extends EventEmitter {
  private model?: LlamaModel;
  private context?: LlamaContext;

  async initialize(): Promise<void> {
    try {
      this.model = new LlamaModel({
        modelPath: this.config.modelPath,
      });
      
      this.context = new LlamaContext({
        model: this.model,
        contextSize: this.config.contextSize,
      });
    } catch (error) {
      throw new Error(`Initialization failed: ${error}`);
    }
  }
}
```

### Documentation

1. **JSDoc for public APIs**
   ```typescript
   /**
    * Generate AI response from user input
    * @param messages - Conversation history
    * @param onToken - Callback for streaming tokens
    * @returns AI response with metadata
    */
   async generateResponse(
     messages: ConversationMessage[],
     onToken?: (token: string) => void
   ): Promise<AIResponse> {
     // Implementation
   }
   ```

2. **Inline comments for complex logic**
   ```typescript
   // Calculate token count using approximate ratio of 4 chars per token
   const tokenCount = Math.ceil(text.length / 4);
   ```

3. **README for each module**
   ```
   src/modules/my-module/
   ├── index.ts
   ├── README.md          # Module documentation
   └── types.ts
   ```

### Error Handling

1. **Always throw typed errors**
   ```typescript
   if (!modelFile.exists()) {
     throw new Error('Model file not found');
   }
   ```

2. **Catch and handle appropriately**
   ```typescript
   try {
     await operation();
   } catch (error) {
     console.error(`Operation failed: ${error}`);
     throw error; // Re-throw if can't handle
   }
   ```

3. **Provide helpful error messages**
   ```typescript
   // Good
   throw new Error(`Model file not found at: ${path}. Please check the path.`);
   
   // Bad
   throw new Error('File not found');
   ```

---

## Submitting Changes

### Pull Request Process

1. **Update your branch**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout feature/your-feature
   git rebase develop
   ```

2. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

3. **Create Pull Request on GitHub**
   - Go to your fork on GitHub
   - Click "New Pull Request"
   - Base: `develop` ← Compare: `feature/your-feature`
   - Fill out the PR template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests pass

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
```

### Review Process

1. **Automated checks** must pass:
   - TypeScript compilation
   - Linting
   - Tests (when available)

2. **Code review** by maintainers:
   - At least one approval required
   - Address all feedback
   - Make requested changes

3. **Merge**:
   - Maintainer will merge when approved
   - Branch will be deleted automatically

---

## Reporting Issues

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
Clear description of what the bug is

**To Reproduce**
Steps to reproduce:
1. Run command '...'
2. Enter input '....'
3. See error

**Expected behavior**
What you expected to happen

**Screenshots**
If applicable, add screenshots

**Environment:**
 - OS: [e.g. Windows 11]
 - Node.js version: [e.g. 18.12.0]
 - YunSeeAI version: [e.g. 1.0.0]

**Additional context**
Any other relevant information
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
Clear description of the problem

**Describe the solution you'd like**
What you want to happen

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Any other relevant information
```

### Security Issues

**Do NOT open public issues for security vulnerabilities.**

Instead:
1. Email: security@yunsee-ai.com
2. Provide detailed description
3. Include proof of concept if possible
4. Wait for response before disclosure

---

## Areas for Contribution

### High Priority

1. **WAF Module** - Implement web application firewall
2. **Scanner Module** - Port and vulnerability scanning
3. **Auditor Module** - Security configuration checks
4. **Test Suite** - Comprehensive testing framework

### Medium Priority

1. **Documentation** - Tutorials, examples, guides
2. **Performance** - Optimization and benchmarking
3. **CLI Enhancements** - Better UX, autocomplete
4. **Model Support** - Support for more LLM models

### Good First Issues

1. **Documentation improvements**
2. **Add command aliases**
3. **Improve error messages**
4. **Add examples**
5. **Fix typos**

Look for issues labeled `good first issue` on GitHub.

---

## Development Tips

### Debugging

```bash
# Enable debug logging
export DEBUG=yunsee:*
npm run dev
```

### Testing CLI Locally

```bash
# Build and run
npm run build && npm start

# Or use ts-node directly
npx ts-node src/cli.ts
```

### Profiling Performance

```bash
# Run with profiling
node --prof dist/cli.js

# Analyze profile
node --prof-process isolate-*.log > profile.txt
```

---

## Community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Email** - dev@yunsee-ai.com

### Getting Help

If you need help:
1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Email the team

---

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Significant contributions may earn:
- Maintainer status
- Write access to repository
- Decision-making input

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to YunSeeAI!** 🎉

Your efforts help make security tools accessible to everyone.


