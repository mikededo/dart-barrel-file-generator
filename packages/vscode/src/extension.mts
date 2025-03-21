import type { GenerationConfig, GenerationConfigKeys, GenerationType } from '@dbfg/core';

import type { Uri } from 'vscode';
import { window, workspace } from 'vscode';

import { createContext, toPosixPath } from '@dbfg/core';

const EXTENSION_KEY = 'dart-barrel-file-generator';

const getConfig = <T extends GenerationConfigKeys>(config: T): GenerationConfig[T] | undefined =>
  workspace.getConfiguration().get([EXTENSION_KEY, config].join('.'));

const logger = window.createOutputChannel('DartBarrelFile');
const Context = createContext({
  config: {
    appendFolderName: !!getConfig('appendFolderName'),
    defaultBarrelName: getConfig('defaultBarrelName'),
    excludeDirList: getConfig('excludeDirList') ?? [],
    excludeFileList: getConfig('excludeFileList') ?? [],
    excludeFreezed: !!getConfig('excludeFreezed'),
    excludeGenerated: !!getConfig('excludeGenerated'),
    prependFolderName: !!getConfig('prependFolderName'),
    prependPackageToLibExport: !!getConfig('prependPackageToLibExport'),
    promptName: !!getConfig('promptName'),
    skipEmpty: !!getConfig('skipEmpty')
  },
  logger: {
    done: logger.appendLine,
    error: logger.appendLine,
    log: logger.appendLine,
    warn: logger.appendLine
  }
});

/**
 * Entry point of the extension. When this function is called
 * the context should have already been set up
 */
export const init = async (uri: Uri, type: GenerationType) => {
  if (!type) {
    Context.onError(
      'Extension did not launch properly. Create an issue if this error persists'
    );
    Context.endGeneration();

    window.showErrorMessage('GBDF: Error on initialising the extension');
  }

  if (!workspace.workspaceFolders) {
    throw new Error('The workspace has no folders');
  }

  const workspaceDir = toPosixPath(workspace.workspaceFolders[0].uri.fsPath);
  if (!toPosixPath(uri.fsPath).includes(workspaceDir)) {
    throw new Error('Select a folder from the workspace');
  }

  const result = await Context.start({
    fsPath: uri.fsPath,
    path: uri.path,
    type
  });

  if (result.isErr()) {
    Context.onError(result.error.message);
    Context.endGeneration();

    window.showErrorMessage('GDBF: Error on generating the file', result.error.message);
    return;
  }

  if (result.value) {
    await window.showInformationMessage('GDBF: Generated files!', result.value);
  } else {
    await window.showInformationMessage('GDBF: No dart barrel file has been generated!');
  }

  Context.endGeneration();
};

export const deactivate = () => {
  logger.dispose();
};
