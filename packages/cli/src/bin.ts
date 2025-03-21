#! /usr/bin/env node
/* eslint-disable node/prefer-global/process */

import type { GenerationType } from '@dbfg/core';

import { program } from '@commander-js/extra-typings';
import { ok, ResultAsync } from 'neverthrow';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pc from 'picocolors';
import type { InferInput } from 'valibot';
import * as v from 'valibot';

import { createContext, toPosixPath } from '@dbfg/core';

import { description, name as packageName, version } from '../package.json';

const log = pc.bgBlueBright(pc.black(' INFO '));
const done = pc.bgGreen(pc.black(' DONE '));
const warn = pc.bgYellow(pc.black(' WARN '));
const error = pc.bgRed(pc.black(' ERROR '));
const logger = (prefix: string) => (...messages: string[]) => console.log(prefix, ...messages);
const cliLogger = {
  done: logger(done),
  error: logger(error),
  log: logger(log),
  warn: logger(warn)
};

const SUCCESS_MESSAGES = {
  RECURSIVE: 'Successfully generated recursive barrel files for {path}',
  REGULAR: 'Successfully generated barrel file for {path}',
  REGULAR_SUBFOLDERS: 'Successfully generated barrel file with subfolders for {path}'
};

const Directory = v.string('Provided directory should be a string');
const ConfigPath = v.optional(v.string('`config` must be a string'));
const ConfigSchema = v.object({
  appendFolderName: v.boolean('`appendFolderName` must be a boolean'),
  defaultBarrelName: v.string('`name` must be a string'),
  excludeDirList: v.array(v.string('`excludeDirs` must be an array of strings')),
  excludeFileList: v.array(v.string('`excludeFiles` must be an array of strings')),
  excludeFreezed: v.boolean('`excludeFreezed` must be a boolean'),
  excludeGenerated: v.boolean('`excludeGenerated` must be a boolean'),
  prependFolderName: v.boolean('`prependFolderName` must be a boolean'),
  prependPackageToLibExport: v.boolean('`prependPackageToLibExport` must be a boolean'),
  skipEmpty: v.boolean('`skipEmpty` must be a boolean')
});

const DEFAULT_CONFIG: InferInput<typeof ConfigSchema> = {
  appendFolderName: false,
  defaultBarrelName: '',
  excludeDirList: [],
  excludeFileList: [],
  excludeFreezed: false,
  excludeGenerated: false,
  prependFolderName: false,
  prependPackageToLibExport: false,
  skipEmpty: false
};

const run = async (directory: string, type: GenerationType, config: InferInput<typeof ConfigSchema>) => {
  const Context = createContext({
    config: { ...config, promptName: false },
    logger: cliLogger,
    options: {
      logTimestamps: false
    }
  });

  const result = await Context.start({
    fsPath: directory,
    path: toPosixPath(directory),
    type
  });
  if (result.isErr()) {
    Context.onError(error);
    Context.endGeneration();
  } else {
    Context.endGeneration();
  }

  return result;
};

const loadConfigFile = (configPath: string): ResultAsync<object, Error> => {
  return ResultAsync.fromPromise(
    readFile(configPath, 'utf8')
      .then(content => JSON.parse(content))
      .then(parsed => ({ ...DEFAULT_CONFIG, ...parsed })),
    error => new Error(`Failed to load configuration file: ${error}`)
  );
};

program
  .name(packageName)
  .description(description)
  .version(version)
  .showSuggestionAfterError()
  .showHelpAfterError()
  .argument('<directory>', 'Target directory for barrel file generation')
  .option('-s, --subfolders', 'Include subfolders in the barrel file')
  .option('-r, --recursive', 'Generate barrel files recursively for all nested directories')
  .option('-c, --config <string>', 'Path to configuration file', undefined)
  .option('-n, --default-barrel-name <name>', 'Default name for barrel files', '')
  .option('-q, --quiet', 'Hide all logs', false)
  .option('--excluded-dirs <dirs...>', 'Comma-separated list of directories to exclude', [])
  .option('--excluded-files <files...>', 'Comma-separated list of files to exclude', [])
  .option('--exclude-freezed', 'Exclude freezed files', false)
  .option('--exclude-generated', 'Exclude generated files', false)
  .option('--skip-empty', 'Skip directories with no files', false)
  .option('--append-folder-name', 'Append folder name to barrel file name', false)
  .option('--prepend-folder-name', 'Prepend folder name to barrel file name', false)
  .option('--prepend-package', 'Prepend package name to exports in lib folder', false)
  .action(async (directory, { config, quiet, recursive, subfolders, ...opts }) => {
    const configFile = v.safeParse(ConfigPath, config);
    if (!configFile.success) {
      configFile.issues.forEach((i) => {
        cliLogger.error(i.message);
      });
      process.exit(1);
    }
    const type = recursive ? 'RECURSIVE' : subfolders ? 'REGULAR_SUBFOLDERS' : 'REGULAR';

    if (quiet) {
      Object.assign(cliLogger, {
        done: () => {},
        error: () => {},
        log: () => {},
        warn: () => {}
      });
    }

    const dir = v.parse(Directory, directory);
    const resolvedPath = path.resolve(dir);

    if (!fs.existsSync(resolvedPath)) {
      cliLogger.error(`Error: Directory does not exist: ${resolvedPath}`);
      process.exit(1);
    }

    const { excludedDirs, excludedFiles, prependPackage, ...rest } = opts;
    const configResult = configFile.output
      ? await loadConfigFile(configFile.output)
      : ok({
          excludeDirList: excludedDirs,
          excludeFileList: excludedFiles,
          prependPackageToLibExport: prependPackage,
          ...rest
        });

    if (configResult.isErr()) {
      cliLogger.error(configResult.error.message);
      process.exit(1);
    }

    const parsedConfig = v.safeParse(ConfigSchema, configResult.value);
    if (!parsedConfig.success) {
      cliLogger.error(`Invalid configuration: ${parsedConfig.issues.map(i => i.message).join(', ')}`);
      process.exit(1);
    }

    const res = await run(resolvedPath, type, parsedConfig.output);
    const code = res.match(
      (path) => {
        cliLogger.done(SUCCESS_MESSAGES[type].replace('{path}', path));
        return 0;
      },
      (err) => {
        cliLogger.error(`${err.message}`);
        return 1;
      }
    );
    process.exit(code);
  });

program.parse();

