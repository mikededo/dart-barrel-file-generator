import { OpenDialogOptions } from 'vscode';

export const CONFIGURATIONS = {
  key: 'dartBarrelFileGenerator',
  values: {
    DEFAULT_NAME: 'defaultBarrelName',
    PROMPT_NAME: 'promptName',
    EXCLUDE_FREEZED: 'excludeFreezed',
    EXCLUDE_GENERATED: 'excludeGenerated',
    EXCLUDE_FILES: 'excludeFileList',
    EXCLUDE_DIRS: 'excludeDirList',
    PREPEND_FOLDER: 'prependFolderName',
    APPEND_FOLDER: 'appendFolderName'
  },
  input: {
    canSelectMany: false,
    canSelectFiles: false,
    canSelectFolders: true,
    openLabel: 'Select the folder in which you want to create the barrel file'
  } as Partial<OpenDialogOptions>
};

export const FILE_REGEX = {
  /**
   * Used to check whether the current file name has a
   * dart file extension
   */
  dart: new RegExp('.+(\\.dart)$'),

  /**
   * Used to check whether the current filename has a
   * dart file extension suffixed with the given value
   */
  suffixed: (suffix: string) => new RegExp(`.+(\\.${suffix}\\.dart)$`),

  /**
   * Returns a regex that will match if the filename has
   * the same name as the barrel file of the `folder` param
   *
   * @param {string} folder The folder name
   * @returns {RegExp}
   */
  base: (folder: string): RegExp => new RegExp(`^${folder}\\.dart$`)
};
