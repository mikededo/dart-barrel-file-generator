import type {
  GenerationConfig,
  GenerationLogger,
  GenerationType
} from './types.js';

import * as fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createContext } from './context.js';
import * as fn from './functions.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('./functions');

const createTestConfig = (overrides: Partial<GenerationConfig> = {}): GenerationConfig => ({
  appendFolderName: false,
  defaultBarrelName: '',
  excludeDirList: [],
  excludeFileList: [],
  excludeFreezed: false,
  excludeGenerated: false,
  prependFolderName: false,
  prependPackageToLibExport: false,
  promptName: false,
  skipEmpty: false,
  ...overrides
});

const createTestLogger = (): GenerationLogger => ({
  done: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn()
});

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(fn.toPosixPath).mockImplementation((path) => path);
  vi.mocked(fn.toOsSpecificPath).mockImplementation((path) => path);
  vi.mocked(fn.fileSort).mockImplementation((a, b) => a.localeCompare(b));
  vi.mocked(fsPromises.writeFile).mockResolvedValue(undefined);
});

describe('createContext', () => {
  describe('start', () => {
    it.each([
      ['REGULAR' as GenerationType],
      ['RECURSIVE' as GenerationType],
      ['REGULAR_SUBFOLDERS' as GenerationType]
    ])('should handle %s generation type', async (type) => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);

      if (type === 'REGULAR_SUBFOLDERS') {
        vi.mocked(fn.getAllFilesFromSubfolders)
          .mockReturnValue(['file1.dart', 'file2.dart']);
      } else {
        vi.mocked(fn.getFilesAndDirsFromPath)
          .mockReturnValue([['file1.dart', 'file2.dart'], new Set()]);
      }

      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      const result = await context.start({
        fsPath: '/test/path',
        path: '/test/path',
        type
      });

      // Verify the generation process
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Generation started'));
      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining(`Type: ${type.toLowerCase()}`));
      expect(fs.lstatSync).toHaveBeenCalledWith('/test/path');
      expect(fsPromises.writeFile).toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
    });

    it('should return error when path is not a directory', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false } as fs.Stats);

      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      const result = await context.start({
        fsPath: '/test/file.txt',
        path: '/test/file.txt',
        type: 'REGULAR'
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe('Select a folder from the workspace');
    });

    it('should skip empty folders when skipEmpty is true', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fn.getFilesAndDirsFromPath).mockReturnValue([[], new Set()]);

      const config = createTestConfig({ skipEmpty: true });
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      const result = await context.start({
        fsPath: '/test/path',
        path: '/test/path',
        type: 'REGULAR'
      });

      expect(fsPromises.writeFile).not.toHaveBeenCalled();
      expect(result.isOk()).toBe(true);
    });

    it('should use custom barrel name when provided', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fn.getFilesAndDirsFromPath).mockReturnValue([['file1.dart'], new Set()]);

      const config = createTestConfig({ defaultBarrelName: 'custom_barrel' });
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      await context.start({
        fsPath: '/test/path',
        path: '/test/path',
        type: 'REGULAR'
      });

      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/test/path/custom_barrel.dart',
        expect.any(String),
        'utf8'
      );
    });

    it('should prepend package name when configured and target is lib folder', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fn.getFilesAndDirsFromPath).mockReturnValue([['file1.dart'], new Set()]);
      vi.mocked(fn.isTargetLibFolder).mockReturnValue(true);

      const config = createTestConfig({ prependPackageToLibExport: true });
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      await context.start({
        fsPath: '/test/my_package/lib',
        path: '/test/my_package/lib',
        type: 'REGULAR'
      });

      expect(fn.isTargetLibFolder).toHaveBeenCalled();
      // Verify file was written with package name in the contents
      expect(fsPromises.writeFile).toHaveBeenCalledWith(
        '/test/my_package/lib/lib.dart',
        expect.stringContaining('export \'package:'),
        'utf8'
      );
    });

    it('should handle recursive generation for subdirectories', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fn.getFilesAndDirsFromPath).mockImplementation((_, path) => {
        if (path === '/test/path') {
          return [['file1.dart'], new Set(['subfolder'])];
        } else if (path === '/test/path/subfolder') {
          return [['subfile1.dart'], new Set()];
        }

        return [[], new Set()];
      });

      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      await context.start({
        fsPath: '/test/path',
        path: '/test/path',
        type: 'RECURSIVE'
      });

      // Expect two writeFile calls - one for main dir and one for subdir
      expect(fsPromises.writeFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('errors', () => {
    it('should handle writeFile errors', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fn.getFilesAndDirsFromPath).mockReturnValue([['file1.dart'], new Set()]);
      vi.mocked(fsPromises.writeFile).mockRejectedValue(new Error('Write error'));

      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      const result = await context.start({
        fsPath: '/test/path',
        path: '/test/path',
        type: 'REGULAR'
      });

      expect(result.isErr()).toBe(true);
      expect(result._unsafeUnwrapErr().message).toBe('Write error');
    });

    it('should log errors with onError method', () => {
      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      context.onError('Test error message');

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('An error occurred'));
      expect(logger.error).toHaveBeenCalledWith('Test error message');
    });
  });

  describe('utility methods', () => {
    it('should provide fsPath accessor', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fn.getFilesAndDirsFromPath).mockReturnValue([['file1.dart'], new Set()]);

      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      expect(context.fsPath.isErr()).toBe(true);

      await context.start({
        fsPath: '/test/path',
        path: '/test/path',
        type: 'REGULAR'
      });

      expect(context.fsPath.isOk()).toBe(true);
      expect(context.fsPath._unsafeUnwrap()).toBe('/test/path');
    });

    it('should provide path accessor', async () => {
      vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => true } as fs.Stats);
      vi.mocked(fn.getFilesAndDirsFromPath).mockReturnValue([['file1.dart'], new Set()]);

      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      expect(context.path.isErr()).toBe(true);

      await context.start({
        fsPath: '/test/path',
        path: '/test/path',
        type: 'REGULAR'
      });

      expect(context.path.isOk()).toBe(true);
      expect(context.path._unsafeUnwrap()).toBe('/test/path');
    });

    it('should log completion with endGeneration method', () => {
      const config = createTestConfig();
      const logger = createTestLogger();
      const context = createContext({ config, logger });

      context.endGeneration();

      expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('Generation finished'));
    });
  });
});
