# @dbfg/cli

Command-line interface for generating and maintaining Dart barrel files.

## Recommended usage

The recommended usage is through `bunx` or the equivalent from your package of
choice:

```sh
bunx @dbfg/cli@latest [options] <directory>
```

## Installation

Globally install it with:

```sh
bun install -g @dbfg/cli
```

You will now have the `dbfg-cli` executable available.

## Usage

`dbfg-cli` creates barrel files for your Dart projects, making it easier to manage exports.

### Generation Modes

The CLI supports three generation modes:

1. **Regular mode** (default): Generates a barrel file for only the specified directory

```sh
dbfg-cli <directory>
```

2. **Recursive mode**: Generates barrel files for the target directory and all
   nested subdirectories

```sh
dbfg-cli --recursive <directory>
```

3. **Subfolders mode**: Generates a single barrel file that includes exports
   from all files of subdirectories

```sh
dbfg-cli --subfolders <directory>
```

### Options

```sh
-V, --version                     output the version number
-s, --subfolders                  Include subfolders in the barrel file
-r, --recursive                   Generate barrel files recursively for all nested directories
-c, --config <string>             Path to configuration file
-n, --default-barrel-name <name>  Default name for barrel files (default: "")
--excluded-dirs <dirs...>         Comma-separated list of directories to exclude (default: [])
--excluded-files <files...>       Comma-separated list of files to exclude (default: [])
--exclude-freezed                 Exclude freezed files (default: false)
--exclude-generated               Exclude generated files (default: false)
--skip-empty                      Skip directories with no files (default: false)
--append-folder-name              Append folder name to barrel file name (default: false)
--prepend-folder-name             Prepend folder name to barrel file name (default: false)
--prepend-package                 Prepend package name to exports in lib folder (default: false)
-h, --help                        display help for command
```

### Examples

Generate a barrel file for the `lib` directory:

```sh
dbfg ./lib
```

Generate barrel files recursively for the `src` directory and all its
subdirectories:

```sh
dbfg --recursive ./src
```

Generate a barrel file for `lib` with a custom name:

```sh
dbfg ./lib -n index
```

Exclude generated files:

```sh
dbfg ./src --exclude-freezed --exclude-generated
```

Exclude specific files using patterns:

```sh
dbfg ./src --excluded-files "*_one.dart" "*_test.dart"
```

### Configuration File

You can use a JSON configuration file to define default options:

```json
{
  "defaultBarrelName": "index",
  "excludeFreezed": true,
  "excludeGenerated": true,
  "excludeFileList": ["*_test.dart"],
  "excludeDirList": ["test"],
  "prependPackageToLibExport": true
}
```

Then simply pass the `--config` option:

```sh
dbfg ./src --config ./dbfg.json
```
