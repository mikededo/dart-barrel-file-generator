import type { FocusedGenerations, GenerationType } from '@dbfg/core';

import type { ExtensionContext } from 'vscode';
import { commands, Uri, window } from 'vscode';

import { init } from './extension.mjs';

export { deactivate } from './extension.mjs';

/**
 * Curried function that, from the given type of the generation,
 * it will set up the context with the `uri` received from the curried fn
 * and the given type
 */
const generate = (type: GenerationType) => async (uri: undefined | Uri) => {
  const maybeUri = uri ?? await window.showOpenDialog({
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    openLabel: 'Select the folder '
  }).then((uris) => uris && uris[0]);

  if (!maybeUri) {
    return;
  }

  await init(maybeUri, type);
};

const generateFocused = (type: FocusedGenerations) => async () => {
  const activeEditor = window.activeTextEditor;
  if (!activeEditor) {
    return;
  }

  const parent = Uri.joinPath(activeEditor.document.uri, '..');
  await generate(type)(parent);
};

export const activate = (context: ExtensionContext) => {
  // Generate current
  context.subscriptions.push(
    commands.registerCommand(
      'dart-barrel-file-generator.generateCurrent',
      generate('REGULAR')
    )
  );
  // For current folder
  context.subscriptions.push(
    commands.registerCommand(
      'dart-barrel-file-generator.generateFocusedParent',
      generateFocused('REGULAR_FOCUSED')
    )
  );

  // Generate current with subfolders
  context.subscriptions.push(
    commands.registerCommand(
      'dart-barrel-file-generator.generateCurrentWithSubfolders',
      generate('REGULAR_SUBFOLDERS')
    )
  );

  // Generate current and nested
  context.subscriptions.push(
    commands.registerCommand(
      'dart-barrel-file-generator.generateCurrentAndNested',
      generate('RECURSIVE')
    )
  );
};
