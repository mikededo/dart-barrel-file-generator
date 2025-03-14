import type { GenerationConfig } from './types.js';

import { minimatch } from 'minimatch';
import { readdirSync } from 'node:fs';
import { posix, sep } from 'node:path';

import { FILE_REGEX } from './constants.js';

const path = { posix, sep };

type PosixPath = string;

/**
 * Converts a path to a generic `PosixPath`
 *
 * @param pathLike Path location
 * @returns An equal location with posix separators
 */
export const toPosixPath = (pathLike: string): PosixPath =>
  pathLike.split(path.sep).join(path.posix.sep);

export const formatDate = (date: Date = new Date()) =>
  date.toISOString().replace(/T/, ' ').replace(/\..+/, '');

/**
 * Checks if the given target path is the lib folder
 *
 * @param targetPath The barrel file target path
 * @returns If the path is the `lib` folder
 */
export const isTargetLibFolder = (targetPath: string) => {
  const parts = targetPath.split('/');
  return parts[parts.length - 1] === 'lib';
};

/**
 * Converts a `PosixPath` to a OS specific path
 *
 * @param posixPath Current path
 * @returns A location path with os specific separators
 */
export const toOsSpecificPath = (posixPath: PosixPath) =>
  posixPath.split(path.posix.sep).join(path.sep);

/**
 * Checks if a file is a dart file
 *
 * @param fileName The file name to evaluate
 * @returns If the file name is a valid dart file
 */
export const isDartFile = (fileName: string) => FILE_REGEX.dart.test(fileName);

/**
 * Checks if a file has the name of the current folder barrel file
 *
 * @param dirName The directory name
 * @param fileName The file name to evaluate
 * @returns If the file name equals the name of the
 * barrel file
 */
export const isBarrelFile = (dirName: string, fileName: string) =>
  FILE_REGEX.base(dirName).test(fileName);

/**
 * Checks if the given file name matches the given glob
 *
 * @param fileName The file to check for
 * @param glob The glob to compare the string with
 * @returns Whether it matches the glob or not
 */
export const matchesGlob = (fileName: string, glob: string) =>
  minimatch(fileName, glob);

/**
 * Sorts the file names alphabetically
 */
export const fileSort = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0;

/**
 * Checks if the given `posixPath` is a dart file, it has a different
 * name than the folder barrel file and is not excluded by any configuration
 *
 * @param fileName File name
 * @param filePath File path
 * @param dirName The current directory name
 * @returns If the given `posixPath` should be added to the list of
 * exports
 */
export const shouldExport = (
  fileName: PosixPath,
  filePath: PosixPath,
  dirName: string,
  { excludeFileList, excludeFreezed, excludeGenerated }: GenerationConfig
) => {
  if (isDartFile(fileName) && !isBarrelFile(dirName, fileName)) {
    if (FILE_REGEX.suffixed('freezed').test(fileName)) {
      // Export only if files are not excluded
      return !excludeFreezed;
    }

    if (FILE_REGEX.suffixed('g').test(fileName)) {
      // Export only if files are not excluded
      return !excludeGenerated;
    }

    const globs: string[] = excludeFileList ?? [];
    return globs.every(glob => !matchesGlob(filePath, glob));
  }

  return false;
};

/**
 * Checks if the given `posixPath` is not excluded by any configuration
 *
 * @param posixPath The path to check
 * @returns If the given `posixPath` should be added to the list of
 * exports
 */
export const shouldExportDirectory = (posixPath: PosixPath, { excludeDirList }: GenerationConfig) =>
  (excludeDirList ?? []).every(glob => !matchesGlob(posixPath, glob));

/**
 * Gets the list of files and a set of directories from the given path
 * without the path in the name.
 *
 * @param barrel The name of the barrel file
 * @param path The name of the path to check for
 */
export const getFilesAndDirsFromPath = (
  barrel: string,
  path: string,
  config: GenerationConfig
): [string[], Set<string>] => {
  const files: string[] = [];
  const dirs = new Set<string>();

  for (const curr of readdirSync(path, { withFileTypes: true })) {
    const fullPath = `${path}/${curr.name}`;
    if (curr.isFile()) {
      if (shouldExport(curr.name, fullPath, barrel, config)) {
        files.push(curr.name);
      }
    } else if (curr.isDirectory()) {
      if (shouldExportDirectory(fullPath, config)) {
        dirs.add(curr.name);
      }
    }
  }

  return [files, dirs];
};

/**
 * Gets the list of all the files from the current path and its
 * nested folders (including all subfolders)
 *
 * @param barrel The name of the barrel file
 * @param path The name of the path to check for
 */
export const getAllFilesFromSubfolders = (
  barrel: string,
  path: string,
  opts: GenerationConfig
) => {
  const resultFiles: string[] = [];
  const [files, dirs] = getFilesAndDirsFromPath(barrel, path, opts);

  resultFiles.push(...files);

  if (dirs.size > 0) {
    for (const d of dirs) {
      const folderFiles = getAllFilesFromSubfolders(barrel, `${path}/${d}`, opts);
      resultFiles.push(...folderFiles.map(f => `${d}/${f}`));
    }
  }

  return resultFiles;
};

