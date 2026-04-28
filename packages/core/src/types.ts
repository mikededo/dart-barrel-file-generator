export type FocusedGenerations = 'REGULAR_FOCUSED';
export type GenerationType = FocusedGenerations | RegularGenerations;
export type RegularGenerations =
  | 'RECURSIVE' |
  'REGULAR_SUBFOLDERS' |
  'REGULAR';

export type Maybe<T> = T | undefined;

export type GenerationConfig = {
  appendFolderName: boolean;
  defaultBarrelName: string | undefined;
  excludeDirList: string[];
  excludeFileList: string[];
  excludeFreezed: boolean;
  excludeGenerated: boolean;
  prependFolderName: boolean;
  prependPackageToLibExport: boolean;
  promptName: boolean;
  skipEmpty: boolean;
};
export type GenerationConfigKeys = keyof GenerationConfig;
export type GenerationLogger = {
  done: LogFn;
  error: LogFn;
  log: LogFn;
  warn: LogFn;
};
type LogFn = (...args: string[]) => void;
