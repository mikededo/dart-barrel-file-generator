#! /usr/bin/bash
# Build all packages
bun run build
bun run --cwd packages/vscode package --ci

bun changeset publish
bun run --cwd packages/vscode publish
bun run --cwd packages/vscode publish:cursor
