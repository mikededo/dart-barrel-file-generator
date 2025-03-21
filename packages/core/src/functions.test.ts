import type { GenerationConfig } from './types.js';

import type * as fs from 'node:fs';

import {
  fileSort,
  formatDate,
  getAllFilesFromSubfolders,
  getFilesAndDirsFromPath,
  isBarrelFile,
  isDartFile,
  isTargetLibFolder,
  matchesGlob,
  shouldExport,
  shouldExportDirectory,
  toOsSpecificPath,
  toPosixPath
} from './functions.js';

const DEFAULT_CONFIG_OPTIONS: GenerationConfig = {
  appendFolderName: false,
  defaultBarrelName: undefined,
  excludeDirList: [],
  excludeFileList: [],
  excludeFreezed: false,
  excludeGenerated: false,
  prependFolderName: false,
  prependPackageToLibExport: false,
  promptName: false,
  skipEmpty: false
};

const mockSepValue = vi.hoisted(vi.fn);
vi.mock('node:path', async () => {
  const actual = await vi.importActual('node:path');
  mockSepValue.mockReturnValue('/');

  return {
    ...actual,
    get sep() {
      return mockSepValue();
    }
  };
});

const mockReaddirSync = vi.hoisted(vi.fn<typeof fs.readdirSync>);
vi.mock('node:fs', async (importActual) => ({
  ...(await importActual()),
  readdirSync: mockReaddirSync
}));

const notImplemented = (fn: string) => () => {
  throw new Error(`${fn} not implemented.`);
};

type ReaddirSync = ReturnType<typeof fs.readdirSync>[number];
const createReaddirSyncMock = (props: Partial<ReaddirSync>): ReaddirSync => ({
  isBlockDevice: notImplemented('isBlockDevice'),
  isCharacterDevice: notImplemented('isCharacterDevice'),
  isDirectory: notImplemented('isDirectory'),
  isFIFO: notImplemented('isFIFO'),
  isFile: notImplemented('isFile'),
  isSocket: notImplemented('isSocket'),
  isSymbolicLink: notImplemented('isSymbolicLink'),
  name: '',
  parentPath: '',
  path: '',
  ...props
});

describe('toPosixPath', () => {
  it('converts windows-style paths to posix paths', () => {
    mockSepValue.mockImplementationOnce(() => '\\');

    const windowsPath = 'C:\\Users\\test\\dart\\project';
    expect(toPosixPath(windowsPath)).toBe('C:/Users/test/dart/project');
  });

  it('leaves posix paths unchanged', () => {
    const posixPath = '/Users/test/dart/project';
    expect(toPosixPath(posixPath)).toBe(posixPath);
  });
});

describe('formatDate', () => {
  it('formats the current date correctly', () => {
    expect(formatDate(new Date('2023-05-15T12:30:45.123Z'))).toBe('2023-05-15 12:30:45');
  });

  it('uses current date when no date is provided', () => {
    expect(formatDate()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe('isTargetLibFolder', () => {
  it('returns true when path ends with lib', () => {
    expect(isTargetLibFolder('/project/lib')).toBe(true);
    expect(isTargetLibFolder('C:/dart/project/lib')).toBe(true);
  });

  it('returns false when path does not end with lib', () => {
    expect(isTargetLibFolder('/project/src')).toBe(false);
    expect(isTargetLibFolder('/project/lib/src')).toBe(false);
    expect(isTargetLibFolder('lib/src')).toBe(false);
  });
});

describe('toOsSpecificPath', () => {
  afterEach(() => {
    mockSepValue.mockRestore();
  });

  it('converts posix paths to OS-specific paths (/)', () => {
    const posixPath = '/Users/test/dart/project';
    expect(toOsSpecificPath(posixPath)).toBe(posixPath.split('/').join('/'));
  });

  it('converts posix paths to OS-specific paths (\\\\)', () => {
    mockSepValue.mockImplementation(() => '\\\\');

    const posixPath = '/Users/test/dart/project';
    expect(toOsSpecificPath(posixPath)).toBe(posixPath.split('/').join('\\\\'));
  });
});

describe('isDartFile', () => {
  it('returns true for dart files', () => {
    expect(isDartFile('test.dart')).toBe(true);
    expect(isDartFile('complex_name.dart')).toBe(true);
  });

  it('returns false for non-dart files', () => {
    expect(isDartFile('test.txt')).toBe(false);
    expect(isDartFile('dart.js')).toBe(false);
    expect(isDartFile('test.dart.bak')).toBe(false);
  });
});

describe('isBarrelFile', () => {
  it('returns true when file matches directory barrel name', () => {
    expect(isBarrelFile('src', 'src.dart')).toBe(true);
    expect(isBarrelFile('models', 'models.dart')).toBe(true);
  });

  it('returns false when file does not match directory barrel name', () => {
    expect(isBarrelFile('src', 'main.dart')).toBe(false);
    expect(isBarrelFile('models', 'user.dart')).toBe(false);
  });
});

describe('matchesGlob', () => {
  it('matches files with glob pattern correctly', () => {
    expect(matchesGlob('test.dart', '*.dart')).toBe(true);
    expect(matchesGlob('/path/to/test.dart', '**/*.dart')).toBe(true);
    expect(matchesGlob('test.freezed.dart', '*.freezed.dart')).toBe(true);
  });

  it('returns false when file does not match glob pattern', () => {
    expect(matchesGlob('test.dart', '*.js')).toBe(false);
    expect(matchesGlob('/path/to/test.dart', '/other/path/**/*.dart')).toBe(false);
  });
});

describe('fileSort', () => {
  it('sorts strings alphabetically', () => {
    expect(fileSort('a', 'b')).toBe(-1);
    expect(fileSort('b', 'a')).toBe(1);
    expect(fileSort('a', 'a')).toBe(0);

    const files = ['c.dart', 'a.dart', 'b.dart'];
    expect(files.sort(fileSort)).toEqual(['a.dart', 'b.dart', 'c.dart']);
  });
});

describe('shouldExport', () => {
  it('returns true for regular dart files', () => {
    expect(
      shouldExport('test.dart', '/path/test.dart', 'path', DEFAULT_CONFIG_OPTIONS)
    ).toBe(true);
  });

  it('returns false for barrel files', () => {
    expect(
      shouldExport('folder.dart', '/path/folder.dart', 'folder', DEFAULT_CONFIG_OPTIONS)
    ).toBe(false);
  });

  it('returns false for non-dart files', () => {
    expect(
      shouldExport('test.js', '/path/test.js', 'path', DEFAULT_CONFIG_OPTIONS)
    ).toBe(false);
  });

  it.each([true, false])(
    'handles freezed files according to config (excludeFreezed: %o)',
    (excludeFreezed) => {
      expect(
        shouldExport(
          'test.freezed.dart',
          '/path/test.freezed.dart',
          'path',
          { ...DEFAULT_CONFIG_OPTIONS, excludeFreezed }
        )
      ).toBe(!excludeFreezed);
    }
  );

  it.each([true, false])(
    'handles generated files according to config (excludeGenerated: %o)',
    (excludeGenerated) => {
      expect(
        shouldExport(
          'test.g.dart',
          '/path/test.g.dart',
          'path',
          { ...DEFAULT_CONFIG_OPTIONS, excludeGenerated }
        )
      ).toBe(!excludeGenerated);
    }
  );

  it('respects exclude file list', () => {
    expect(shouldExport('excluded.dart', '/path/excluded.dart', 'path', {
      ...DEFAULT_CONFIG_OPTIONS,
      excludeFileList: ['**/excluded.dart']
    })).toBe(false);

    expect(shouldExport('included.dart', '/path/included.dart', 'path', {
      ...DEFAULT_CONFIG_OPTIONS,
      excludeFileList: ['**/excluded.dart']
    })).toBe(true);
  });
});

describe('shouldExportDirectory', () => {
  it('returns true for non-excluded directories', () => {
    expect(shouldExportDirectory('/path/dir', DEFAULT_CONFIG_OPTIONS)).toBe(true);
  });

  it('returns false for excluded directories', () => {
    expect(shouldExportDirectory('/path/excluded', {
      ...DEFAULT_CONFIG_OPTIONS,
      excludeDirList: ['**/excluded']
    })).toBe(false);
  });

  it('returns true when directory does not match exclusion pattern', () => {
    expect(shouldExportDirectory('/path/included', {
      ...DEFAULT_CONFIG_OPTIONS,
      excludeDirList: ['**/excluded']
    })).toBe(true);
  });
});

describe('getFilesAndDirsFromPath', () => {
  beforeEach(() => {
    mockReaddirSync.mockClear();
  });

  afterAll(() => {
    mockReaddirSync.mockRestore();
  });

  it('correctly identifies files and directories', () => {
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file.dart' }),
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'dir' })
    ]);

    const [files, dirs] = getFilesAndDirsFromPath('barrel', '/path', DEFAULT_CONFIG_OPTIONS);

    expect(files).toEqual(['file.dart']);
    expect(dirs.has('dir')).toBe(true);
    expect(dirs.size).toBe(1);
  });

  it('filters out barrel files', () => {
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'barrel.dart' }),
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file.dart' })
    ]);

    const [files, dirs] = getFilesAndDirsFromPath('barrel', '/path', DEFAULT_CONFIG_OPTIONS);

    expect(files).toEqual(['file.dart']);
    expect(files).not.toContain('barrel.dart');
    expect(dirs.size).toBe(0);
  });

  it('respects exclude configurations for files', () => {
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file.dart' }),
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'excluded.dart' })
    ]);

    const [files] = getFilesAndDirsFromPath('barrel', '/path', {
      ...DEFAULT_CONFIG_OPTIONS,
      excludeFileList: ['**/excluded.dart']
    });

    expect(files).toEqual(['file.dart']);
    expect(files).not.toContain('excluded.dart');
  });

  it('respects exclude configurations for directories', () => {
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'dir' }),
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'excluded_dir' })
    ]);

    const [_, dirs] = getFilesAndDirsFromPath('barrel', '/path', {
      ...DEFAULT_CONFIG_OPTIONS,
      excludeDirList: ['**/excluded_dir']
    });

    expect(dirs.has('dir')).toBe(true);
    expect(dirs.has('excluded_dir')).toBe(false);
  });

  it('ignores non-dart files', () => {
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file.dart' }),
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file.js' })
    ]);

    const [files] = getFilesAndDirsFromPath('barrel', '/path', DEFAULT_CONFIG_OPTIONS);

    expect(files).toEqual(['file.dart']);
    expect(files).not.toContain('file.js');
  });
});

describe('getAllFilesFromSubfolders', () => {
  beforeEach(() => {
    mockReaddirSync.mockClear();
  });

  afterAll(() => {
    mockReaddirSync.mockRestore();
  });

  it('collects files from current directory', () => {
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file1.dart' }),
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file2.dart' })
    ]);

    const files = getAllFilesFromSubfolders('barrel', '/path', DEFAULT_CONFIG_OPTIONS);

    expect(files).toEqual(['file1.dart', 'file2.dart']);
  });

  it('collects files from subdirectories with correct paths', () => {
    // Root directory
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file.dart' }),
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'subdir' })
    ]);
    // Subdir
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'subfile.dart' })
    ]);

    const files = getAllFilesFromSubfolders('barrel', '/path', DEFAULT_CONFIG_OPTIONS);

    expect(files).toContain('file.dart');
    expect(files).toContain('subdir/subfile.dart');
    expect(files.length).toBe(2);
  });

  it('handles deeply nested directories', () => {
    // Root directory
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'file.dart' }),
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'level1' })
    ]);
    // L1
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'level1_file.dart' }),
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'level2' })
    ]);
    // L2
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'level2_file.dart' })
    ]);

    const files = getAllFilesFromSubfolders('barrel', '/path', DEFAULT_CONFIG_OPTIONS);

    expect(files).toContain('file.dart');
    expect(files).toContain('level1/level1_file.dart');
    expect(files).toContain('level1/level2/level2_file.dart');
    expect(files.length).toBe(3);
  });

  it('respects exclusions in nested directories', () => {
    // Root directory
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({
        isDirectory: () => false,
        isFile: () => true,
        name: 'file.dart',
        parentPath: '',
        path: ''
      }),
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'included' }),
      createReaddirSyncMock({ isDirectory: () => true, isFile: () => false, name: 'excluded' })
    ]);
    // Included directory
    mockReaddirSync.mockReturnValueOnce([
      createReaddirSyncMock({ isDirectory: () => false, isFile: () => true, name: 'included_file.dart' })
    ]);

    const files = getAllFilesFromSubfolders('barrel', '/path', {
      ...DEFAULT_CONFIG_OPTIONS,
      excludeDirList: ['**/excluded']
    });

    expect(files).toContain('file.dart');
    expect(files).toContain('included/included_file.dart');
    expect(files.length).toBe(2);
    expect(mockReaddirSync).toHaveBeenCalledTimes(2); // Only root and included dir
  });
});
