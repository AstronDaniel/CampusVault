# Contributing to CampusVault

First off, thank you for considering contributing to CampusVault! It's people like you that make CampusVault such a great tool for students worldwide.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and encourage diverse perspectives
- Focus on what is best for the community
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** (screenshots, code samples)
- **Describe the behavior you observed and what you expected**
- **Include details about your environment** (Android version, device model, app version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions or features you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `master`
2. **Follow the coding style** of the project
3. **Write clear commit messages**
4. **Update documentation** if you're adding features
5. **Add tests** if applicable
6. **Ensure the test suite passes**
7. **Submit a pull request**

## Development Setup

### Prerequisites
- Android Studio Hedgehog (2023.1.1) or later
- JDK 11 or later
- Android SDK with API level 36

### Setting Up Your Development Environment

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/CampusVault.git
   cd CampusVault
   ```

2. Open the project in Android Studio

3. Let Gradle sync and download dependencies

4. Build the project:
   ```bash
   ./gradlew build
   ```

## Coding Standards

### Java Style Guide
- Follow standard Java naming conventions
- Use camelCase for variables and methods
- Use PascalCase for classes
- Keep lines under 120 characters
- Add JavaDoc comments for public methods and classes

### Code Organization
- Place new features in appropriate packages
- Follow the existing MVVM architecture
- Keep ViewModels independent of Android framework
- Use dependency injection with Hilt
- Keep business logic in repositories

### Commit Message Guidelines

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(upload): add support for multiple file uploads

fix(auth): resolve login crash on Android 14

docs(readme): update installation instructions
```

## Testing

### Running Tests

```bash
# Run unit tests
./gradlew test

# Run instrumentation tests
./gradlew connectedAndroidTest
```

### Writing Tests
- Write unit tests for ViewModels and repositories
- Write instrumentation tests for UI components
- Aim for meaningful test coverage
- Test edge cases and error scenarios

## Project Structure

```
app/src/main/java/com/example/campusvault/
├── data/           # Data layer (models, repositories, local/remote sources)
├── ui/             # Presentation layer (Activities, Fragments, ViewModels)
│   ├── auth/       # Authentication screens
│   ├── main/       # Main app screens
│   ├── onboarding/ # Onboarding flow
│   └── dialogs/    # Reusable dialog components
└── utils/          # Utility classes and helpers
```

## Review Process

1. All submissions require review
2. Maintainers will review your pull request
3. Address any requested changes
4. Once approved, a maintainer will merge your PR

## Questions?

Feel free to open an issue with the `question` label, or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CampusVault! 🎓📚
