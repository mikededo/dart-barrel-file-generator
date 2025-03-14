# @dbf/core

## 2.1.0

### Minor Changes

- Validate `workspace` folders in `vscode` package as it's specific feature ([#121](https://github.com/mikededo/dart-barrel-file-generator/pull/121))

## 2.0.2

### Patch Changes

- Use `fsPath` for generation ([`0ec29d2`](https://github.com/mikededo/dart-barrel-file-generator/commit/0ec29d2408e11e4c94860cdd3d971ade7b3bc4ea))

## 2.0.1

### Patch Changes

- Implement missing `onError` ([`279a8a2`](https://github.com/mikededo/dart-barrel-file-generator/commit/279a8a2794fd83ae1d2d350aac4e060098c010df))

## 2.0.0

### Major Changes

- Update the implementation of the `core`, and move all the generation logic into it. ([#116](https://github.com/mikededo/dart-barrel-file-generator/pull/116))

## 1.0.1

### Patch Changes

- Replace `dartBarrelFileGenerator` for `dart-barrel-file-generator` ([`0a4b3d6`](https://github.com/mikededo/dart-barrel-file-generator/commit/0a4b3d6e1188aa528d33aa33f578416ccb684b11))

## 1.0.0

### Major Changes

- a864a2a: Refactored into a monorepo setup. While this adds a breaking change, it does not
  affect the extension itself. It's a major release as it involves a major update
  into the codebase.
  Plus, the repository has also been cleaned up from dependencies and other
  issues.
