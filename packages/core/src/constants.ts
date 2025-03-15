export const FILE_REGEX = {
  /**
   * Returns a regex that will match if the filename has
   * the same name as the barrel file of the `folder` param
   *
   * @param {string} folder The folder name
   * @returns {RegExp} The regex
   */
  base: (folder: string): RegExp => new RegExp(`^${folder}\\.dart$`),

  /**
   * Used to check whether the current file name has a
   * dart file extension
   */
  dart: /.+(\.dart)$/,

  /**
   * Used to check whether the current filename has a
   * dart file extension suffixed with the given value
   */
  suffixed: (suffix: string) => new RegExp(`.+(\\.${suffix}\\.dart)$`)
};
