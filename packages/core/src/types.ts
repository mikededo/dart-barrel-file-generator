export type FocusedGenerations = 'REGULAR_FOCUSED';
export type GenerationType = FocusedGenerations | RegularGenerations;
export type RegularGenerations =
  | 'RECURSIVE'
  | 'REGULAR_SUBFOLDERS'
  | 'REGULAR';

export type Maybe<T> = T | undefined;

export type GenerationConfig = {
  defaultBarrelName: string | undefined;
  excludeDirList: string[];
  excludeFileList: string[];
  excludeFreezed: boolean;
  excludeGenerated: boolean;
  skipEmpty: boolean;
  appendFolderName: boolean;
  prependFolderName: boolean;
  prependPackageToLibExport: boolean;
  promptName: boolean;
};
export type GenerationConfigKeys = keyof GenerationConfig;
export type GenerationLogger = {
  warn: LogFn;
  done: LogFn;
  error: LogFn;
  log: LogFn;
};
type LogFn = (...args: string[]) => void;
