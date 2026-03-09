# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tooling

Assume Node.js v24 or later, and use new Node.js features freely.

## Style
Avoid importing functions from modules to the global namespace.  Instead, import the module and qualify the function.  Example:
```
import path from 'node:path';
path.join();
```
is good, while
```
import {join} from 'node:path';
join();
```
is bad.

Do not put spaces inside curly braces.  `{a: 1}`  is good, `{ a: 1 }`  is bad.

## Project purpose

`find-stale-comments` is a Git pre-commit hook script (TypeScript module run directly in Node.js, without a separate transpilation step) that detects when code was changed without updating the preceding comment. It is intentionally language-agnostic: it treats a comment as pertaining to the code between itself and the first empty line below it.

## Running

The entry point is `index.ts` (ESM module in TypeScript). It is meant to be invoked as a pre-commit hook:

```
node index.ts
```

## Testing

Test framework: `node:test` (built-in).

Most tests are **unit tests** that test individual functions exported from `index.ts`. They use
fixture files from `tests/fixtures/`: `.patch` files are parsed by `parse-diff` and passed to the
detection logic; `.ante.*` files provide the old file content. Neither `simple-git` nor
`parse-diff` need to be mocked.

A small number of **integration tests** cover the full pipeline: each creates a temporary git repo,
writes and stages files, runs the script, and asserts on its output.

### Fixture files

Fixtures live in `tests/fixtures/` and are **not committed** — they are listed in `.gitignore`.
Each fixture consists of two files:

- A `.patch` file (unified diff), parsed by `parse-diff` and passed to the detection logic.
- An `.ante.*` file (the "old" file content), used as the pre-change file in tests.

Fixtures are generated from **source pairs** in `tests/source/`: for each test case there is a
`<name>.ante.<ext>` file (old content) and a `<name>.post.<ext>` file (new/staged content).
These source pairs **are committed** and are the source of truth for what each fixture represents.

Run `npm run fixtures` to regenerate. The generator (`tests/generate-fixtures.ts`):

1. Copies each `.ante.*` file from `tests/source/` to `tests/fixtures/`.
2. Runs `git diff --no-index` on the ante/post pair and saves the output as a `.patch` file.
