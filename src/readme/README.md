# README Generator Module

This module generates comprehensive README files from benchmark results for the Zsh Plugin Manager Benchmark project.

## Overview

The README generator processes benchmark data and produces a well-formatted markdown document with:
- Executive summary with key findings
- Performance rankings for different scenarios
- Visual comparison tables
- GitHub repository information (stars, versions)
- Graph integration support

## Architecture

The module follows a modular architecture with clear separation of concerns:

```
readme/
├── readme-generator.ts    # Main orchestrator
├── data-parser.ts        # Parses and validates benchmark data
├── ranking-engine.ts     # Calculates performance rankings
├── table-builder.ts      # Creates markdown tables
├── github-api.ts        # Fetches repository information
├── graph-handler.ts     # Detects and manages graphs
├── template-engine.ts   # Renders markdown templates
├── performance.ts       # Performance monitoring utilities
├── cache.ts            # Caching utilities
├── errors.ts           # Error handling
├── types.ts            # TypeScript type definitions
├── config/
│   └── repos.json      # GitHub repository mappings
├── templates/
│   └── default.md      # Default README template
└── tests/              # Test files
```

## Usage

### Command Line

```bash
deno run --allow-read --allow-write --allow-net src/readme/readme-generator.ts \
  --input results/benchmark-results-latest.json \
  --output README.md \
  --language ja \
  --debug
```

### Programmatic Usage

```typescript
import { ReadmeGenerator } from "./readme-generator.ts";

const generator = new ReadmeGenerator({
  inputFile: "results/benchmark-results.json",
  outputFile: "README.md",
  language: "ja",
  backup: true,
  debug: false,
});

await generator.generate();
```

## Features

### Performance Rankings
- Generates rankings for load time and installation time
- Supports multiple plugin configurations (0, 25 plugins)
- Awards medals (🥇, 🥈, 🥉) to top performers
- Shows performance differences relative to the best

### Comparison Tables
- Unified table format showing all metrics
- Highlights best values in each category
- Includes GitHub stars when available
- Handles missing data gracefully

### GitHub Integration
- Fetches real-time repository information
- Displays star counts and latest versions
- Generates shield.io badges
- Includes 15-minute caching to avoid rate limits

### Template System
- Flexible template engine with placeholder replacement
- Support for custom templates
- Multi-language support (Japanese/English)
- Markdown formatting with proper escaping

## Configuration

### Repository Mappings

Edit `config/repos.json` to update GitHub repository mappings:

```json
{
  "oh-my-zsh": "ohmyzsh/ohmyzsh",
  "zinit": "zdharma-continuum/zinit",
  "zim": "zimfw/zimfw"
}
```

### Templates

The default template is located at `templates/default.md`. Create custom templates with placeholders:

- `{{badges}}` - GitHub badges
- `{{executedAt}}` - Benchmark execution date
- `{{environment}}` - Test environment details
- `{{keyFindings}}` - Key performance findings
- `{{loadTimeRankings}}` - Load time ranking table
- `{{installTimeRankings}}` - Installation time ranking table
- `{{comparisonTable}}` - Full comparison table
- `{{graphs}}` - Graph images
- `{{versionInfo}}` - Version information

## Testing

Run tests with:

```bash
deno test --allow-read --allow-write --allow-net src/readme/tests/
```

## Quality Checks

Run the quality check script:

```bash
deno run --allow-read --allow-run src/readme/check-quality.ts
```

This checks:
- TypeScript types
- Unit tests
- Code formatting
- Linting
- Import validation
- Documentation

## Error Handling

The module uses typed errors with specific error codes:
- `PARSE_ERROR` - Data parsing failures
- `VALIDATION_ERROR` - Schema validation errors
- `GITHUB_API_ERROR` - GitHub API failures
- `TEMPLATE_ERROR` - Template rendering errors
- `FILE_ERROR` - File I/O errors

## Performance

The module includes performance monitoring:
- Tracks execution time for each phase
- Provides detailed performance reports in debug mode
- Includes caching for GitHub API calls

## Contributing

When adding new features:
1. Update type definitions in `types.ts`
2. Add corresponding tests
3. Update the template if needed
4. Document new placeholders or configuration options