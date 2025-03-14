import type {
  GenerationConfig,
  GenerationLogger,
  GenerationType,
  Maybe
} from './types.js';

import { lstatSync, writeFile } from 'node:fs';

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
};
type StartParams = {
  fsPath: string;
  path: string;
  type: GenerationType;
};
type State = {
  fsPath: string;
  path: string;
  type?: GenerationType;
  promptedName?: string;

  startTimestamp?: number;
};

export const createContext = ({ config, logger }: CreateContextOptions) => {
  const state: State = { fsPath: '', path: '', type: undefined };

  const endGeneration = () => {
    logger.log(`[${formatDate()}] Generation finished`);
  };

  const definedOrError = (value: keyof State) => {
    if (!state[value]) {
      throw new Error(`Cannot access ${value} in context. Did you initialise the context?`);
    }

    return state[value];
  };

  const getPackageName = () => {
    if (!state.path || !state.fsPath) {
      throw new Error('Context.packageName called when no active path');
    }

    const parts = toPosixPath(state.fsPath).split('/lib');
    const path = parts[0].split('/');
    return path[path.length - 1];
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
  ): Promise<string> => {
    let exports = '';
    // Check if we should prepend the package
    const shouldPrependPackage = config.prependPackageToLibExport && isTargetLibFolder(targetPath);
    const prependPackageValue = shouldPrependPackage
      ? `package:${getPackageName()}/`
      : '';

    for (const file of files) {
      exports = `${exports}export '${prependPackageValue}${file}';\n`;
    }

    logger.log(`[${formatDate()}] Exporting ${targetPath} - found ${files.length} Dart files`);
    const barrelFile = `${targetPath}/${dirName}.dart`;

    return new Promise((resolve) => {
      const path = toOsSpecificPath(barrelFile);

      writeFile(path, exports, 'utf8', (error) => {
        if (error) {
          logger.log(error as any);
          throw new Error(error.message);
        }

        logger.log(
          `[${formatDate()}] Generated successfull barrel file at ${path}`
        );
        resolve(path);
      });
    });
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
  const generate = async (targetPath: string): Promise<Maybe<string>> => {
    const skipEmpty = config.skipEmpty;
    const barrelFileName = getBarrelFile(targetPath);

    if (state.type === 'REGULAR_SUBFOLDERS') {
      const files = getAllFilesFromSubfolders(
        barrelFileName,
        targetPath,
        config
      ).sort(fileSort);

      if (files.length === 0 && skipEmpty) {
        return Promise.resolve(undefined);
      }

      return writeBarrelFile(targetPath, barrelFileName, files);
    }

    const [files, dirs] = getFilesAndDirsFromPath(barrelFileName, targetPath, config);
    if (state.type === 'RECURSIVE' && dirs.size > 0) {
      for (const d of dirs) {
        const maybeGenerated = await generate(`${targetPath}/${d}`);
        if (!maybeGenerated && skipEmpty) {
          continue;
        }

        files.push(
          toPosixPath(maybeGenerated as string).split(`${targetPath}/`)[1]
        );
      }
    }

    if (files.length === 0 && skipEmpty) {
      return Promise.resolve(undefined);
    }

    // Sort files
    return writeBarrelFile(targetPath, barrelFileName, files.sort(fileSort));
  };

  const validateAndGenerate = async (): Promise<Maybe<string>> => {
    const dir = toPosixPath(state.fsPath);
    if (!lstatSync(dir).isDirectory()) {
      throw new Error('Select a folder from the workspace');
    }

    return generate(dir);
  };

  const start = ({ fsPath, path, type }: StartParams) => {
    const ts = new Date();
    state.startTimestamp = ts.getTime();

    state.fsPath = fsPath;
    state.path = path;
    state.type = type;

    logger.log(`[${formatDate()}] Generation started ${formatDate(ts)}`);
    logger.log(
      `[${formatDate()}] Type: ${type.toLowerCase()} - Path: ${fsPath}`
    );

    return validateAndGenerate();
  };

  return {
    endGeneration,
    get fsPath() {
      return definedOrError('fsPath');
    },
    onError: (error: string) => {
      logger.log(`[${formatDate()}] An error occurred:`);
      logger.error(error);
    },
    get path() {
      return definedOrError('path');
    },
    start
  };
};
