import type {
  GenerationConfig,
  GenerationLogger,
  GenerationType
} from './types.js';

import type { Result } from 'neverthrow';
import { err, errAsync, ok, ResultAsync } from 'neverthrow';
import { lstatSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

import {
  fileSort,
  formatDate,
  getAllFilesFromSubfolders,
  getFilesAndDirsFromPath,
  isTargetLibFolder,
  toOsSpecificPath,
  toPosixPath
} from './functions.js';

type CreateContextOptions = {
  config: GenerationConfig;
  logger: GenerationLogger;
  options?: { logTimestamps?: boolean };
};
type StartParams = {
  fsPath: string;
  path: string;
  type: GenerationType;
};
type State = {
  fsPath: string;
  path: string;
  startTimestamp?: number;
  type?: GenerationType;
  promptedName?: string;
};

const DEFAULT_OPTIONS: CreateContextOptions['options'] = {
  logTimestamps: true
};
export const createContext = ({ config, logger, options = DEFAULT_OPTIONS }: CreateContextOptions) => {
  const state: State = { fsPath: '', path: '', type: undefined };

  const parseLogString = (log: string) => {
    if (!options.logTimestamps) {
      return log;
    }

    return `[${formatDate()}] ${log}`;
  };

  const endGeneration = () => {
    logger.log(parseLogString('Generation finished'));
  };

  const definedOrError = <T extends keyof State>(value: T): Result<State[T], Error> => {
    if (!state[value]) {
      return err(
        new Error(`Cannot access ${value} in context. Did you initialise the context?`)
      );
    }

    return ok(state[value]);
  };

  const getPackageName = () => {
    if (!state.path || !state.fsPath) {
      return err(new Error('Context.packageName called when no active path'));
    }

    const parts = toPosixPath(state.fsPath).split('/lib');
    const path = parts[0].split('/');
    return ok(`package:${path[path.length - 1]}/`);
  };

  /**
   *
   * @param targetPath The target path of the barrel file
   * @param dirName The barrel file directory name
   * @param files The file names to write to the barrel file
   * @returns A promise with the path of the written barrel file
   */
  const writeBarrelFile = (
    targetPath: string,
    dirName: string,
    files: string[]
  ): ResultAsync<string, Error> => {
    let exports = '';
    // Check if we should prepend the package
    const shouldPrependPackage = config.prependPackageToLibExport && isTargetLibFolder(targetPath);
    const prependPackage = shouldPrependPackage ? getPackageName() : ok('');
    if (prependPackage.isErr()) {
      return errAsync(prependPackage.error);
    }

    for (const file of files) {
      exports = `${exports}export '${prependPackage.value}${file}';\n`;
    }

    logger.log(parseLogString(`Exporting ${targetPath} - found ${files.length} Dart files`));
    const barrelFile = `${targetPath}/${dirName}.dart`;
    const path = toOsSpecificPath(barrelFile);

    return ResultAsync.fromPromise(
      writeFile(path, exports, 'utf8')
        .then(() => {
          logger.log(parseLogString(`Generated successfull barrel file at ${path}`));
          return path;
        }),
      (error: unknown) => {
        logger.log(error as any);
        return error instanceof Error ? error : new Error(String(error));
      }
    );
  };

  /**
   * @param targetPath The target path of the barrel file
   * @returns A promise with the name of the barrel file
   */
  const getBarrelFile = (targetPath: string): string => {
    const shouldAppend = config.appendFolderName;
    const shouldPrepend = config.prependFolderName;

    // Selected target is in the current workspace
    // This could be optional
    const splitDir = targetPath.split('/');
    const prependedDir = shouldPrepend ? `${splitDir[splitDir.length - 1]}_` : '';
    const appendedDir = shouldAppend ? `_${splitDir[splitDir.length - 1]}` : '';

    // Check if the user has the defaultBarrelName config set
    if (config.defaultBarrelName) {
      return `${prependedDir}${config.defaultBarrelName.replace(/ /g, '_').toLowerCase()}${appendedDir}`;
    }

    return `${prependedDir}${splitDir[splitDir.length - 1]}${appendedDir}`;
  };

  /**
   * Generates the contents of the barrel file, recursively when the
   * option chosen is recursive
   *
   * @param targetPath The target path of the barrel file
   * @returns A promise with the path of the written barrel file
   */
  const generate = async (targetPath: string) => {
    const skipEmpty = config.skipEmpty;
    const barrelFileName = getBarrelFile(targetPath);

    if (state.type === 'REGULAR_SUBFOLDERS') {
      const files = getAllFilesFromSubfolders(
        barrelFileName,
        targetPath,
        config
      ).sort(fileSort);

      if (files.length === 0 && skipEmpty) {
        return Promise.resolve(ok(''));
      }

      return writeBarrelFile(targetPath, barrelFileName, files);
    }

    const [files, dirs] = getFilesAndDirsFromPath(barrelFileName, targetPath, config);
    if (state.type === 'RECURSIVE' && dirs.size > 0) {
      for (const d of dirs) {
        const maybeGenerated = await generate(`${targetPath}/${d}`);
        if (maybeGenerated.isErr()) {
          logger.error(maybeGenerated.error.message);
          continue;
        }

        if (!maybeGenerated.value && skipEmpty) {
          continue;
        }

        files.push(
          toPosixPath(maybeGenerated.value).split(`${targetPath}/`)[1]
        );
      }
    }

    if (files.length === 0 && skipEmpty) {
      return Promise.resolve(ok(''));
    }

    // Sort files
    return writeBarrelFile(targetPath, barrelFileName, files.sort(fileSort));
  };

  const validateAndGenerate = async () => {
    const dir = toPosixPath(state.fsPath);
    if (!lstatSync(dir).isDirectory()) {
      return err(new Error('Select a folder from the workspace'));
    }

    return generate(dir);
  };

  const start = ({ fsPath, path, type }: StartParams) => {
    const ts = new Date();
    state.startTimestamp = ts.getTime();

    state.fsPath = fsPath;
    state.path = path;
    state.type = type;

    logger.log(
      parseLogString(`Generation started ${options.logTimestamps ? formatDate(ts) : ''}`)
    );
    logger.log(parseLogString(`Type: ${type.toLowerCase()} - Path: ${fsPath}`));

    return validateAndGenerate();
  };

  return {
    endGeneration,
    get fsPath() {
      return definedOrError('fsPath');
    },
    onError: (error: string) => {
      logger.log(parseLogString(`An error occurred:`));
      logger.error(error);
    },
    get path() {
      return definedOrError('path');
    },
    start
  };
};
