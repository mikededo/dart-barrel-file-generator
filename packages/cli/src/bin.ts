#! /usr/bin/env node
/* eslint-disable node/prefer-global/process */

import type { GenerationType } from '@dbf/core';

import { program } from '@commander-js/extra-typings';
import fs from 'node:fs';
import path from 'node:path';
import type { InferInput } from 'valibot';
import * as v from 'valibot';

import { createContext, toPosixPath } from '@dbf/core';

import { description, name as packageName, version } from '../package.json';

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

export const run = async (directory: string, type: GenerationType, config: InferInput<typeof ConfigSchema>) => {
  const Context = createContext({
    config: { ...config, promptName: false },
    logger: {
      done: console.log,
      error: console.log,
      log: console.log,
      warn: console.log
    }
  });

  try {
    const result = await Context.start({
      fsPath: directory,
      path: toPosixPath(directory),
      type
    });

    Context.endGeneration();
    return result;
  } catch (error: any) {
    Context.onError(error);
    Context.endGeneration();
    throw error;
  }
};

const loadConfigFile = async (configPath: string) => {
  try {
    return JSON.parse(await fs.promises.readFile(configPath, 'utf8'));
  } catch (error) {
    throw new Error(`Failed to load configuration file: ${error}`);
  }
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
  .option('--excluded-dirs <dirs...>', 'Comma-separated list of directories to exclude', [])
  .option('--excluded-files <files...>', 'Comma-separated list of files to exclude', [])
  .option('--exclude-freezed', 'Exclude freezed files', false)
  .option('--exclude-generated', 'Exclude generated files', false)
  .option('--skip-empty', 'Skip directories with no files', false)
  .option('--append-folder-name', 'Append folder name to barrel file name', false)
  .option('--prepend-folder-name', 'Prepend folder name to barrel file name', false)
  .option('--prepend-package', 'Prepend package name to exports in lib folder', false)
  .action(async (directory, { config, recursive, subfolders, ...opts }) => {
    const configFile = v.parse(ConfigPath, config);
    const type = recursive ? 'RECURSIVE' : subfolders ? 'REGULAR_SUBFOLDERS' : 'REGULAR';

    try {
      const dir = v.parse(Directory, directory);
      const resolvedPath = path.resolve(dir);

      if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: Directory does not exist: ${resolvedPath}`);
        process.exit(1);
      }

      const { excludedDirs, excludedFiles, prependPackage, ...rest } = opts;
      const parsedConfig = v.parse(
        ConfigSchema,
        configFile
          ? await loadConfigFile(configFile)
          : {
              excludeDirList: excludedDirs,
              excludeFileList: excludedFiles,
              prependPackageToLibExport: prependPackage,
              ...rest
            }
      );
      await run(resolvedPath, type, parsedConfig);

      console.log(SUCCESS_MESSAGES[type].replace('{path}', resolvedPath));
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse();

