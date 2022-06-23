# Change Log

## 2.1.0

- Updated versions.
- Fixed incorrect usage of RegExp's ([#21](https://github.com/mikededo/dartBarrelFileGenerator/issues/16)).

## 2.0.1

- Updated versions.

## 2.0.0

- Migrated code to TypeScript.
- Added bundler to drastically reduce extension size.
- Added configuration to exclude custom file patterns.

## 1.4.0

- Add option to prompt for the barrel file name when generating a barrel file for a folder ([#16](https://github.com/mikededo/dartBarrelFileGenerator/issues/16)).

## 1.3.1

- Fix files not exporting when suffixed with folder name ([#10](https://github.com/mikededo/dartBarrelFileGenerator/issues/10))

## 1.3.0

- Fix `1.2.1` on Windows OS

## 1.2.1

- Fixed file export when two folders are named the same ([#7](https://github.com/mikededo/dartBarrelFileGenerator/issues/7))

## 1.2.0

- Added file exclusion for generated files.
  - Files type excluded are `.g.dart` and `.freezed.dart`
  - Enabled by default, it can be toggled in the configuration folder.
- Added LICENSE file

## 1.1.0

- Fixed recursive function arguments

## 1.0.3

- Fixed `lodash` dependency missing

## 1.0.2

- Added `Changelog.MD`

## 1.0.1

- Fixed platform specific path bug not initializing the extension

## 0.0.2

- Bug Fixing

## 0.0.1

- Initial release of the extension
