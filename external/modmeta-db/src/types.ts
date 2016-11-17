/**
 * reference to a mod file.
 *
 * You need to specify the modId, the version numbers to accept (see below)
 * and which file to use.
 * 
 * Usually mods on file repositories like nexus have a name including the version
 * number so to match files with a dynamic
 * version number, you can use either a fileExpression, which is a regular
 * expression that should ideally match all versions of a file
 * (i.e. SkyUI_\d+_\d+-3863-\d+-\d+.7z] to match all versions of SkyUI on nexus)
 * or through a "logical" file name, which could be something like
 * "Skimpy Leather Armor UNP" (to differentiate it from the CBBE version under
 * the same modId)
 * logical file names need to be provided by the meta server so they may not
 * exist everywhere but they should be preferred over file expressions where
 * possible.
 * 
 * versionMatch specifies which version to use. It can be
 *  =[version number] for an exact version match.
 * This works independent of the versioning scheme
 * 
 * Or a number of other comparison operators. These work correctly only
 * if the referenced mod uses semantic versioning!
 *  >=[version number] matches any version newer than or equal to the one
 *                     mentioned.
 * In the same way you can use >, <, <=
 * You can combine multiple rules, like ">=1.2.1 <=1.3.6" to match the newest
 * file in the specified range.
 * "1.2.1 - 1.3.6" would have the same effect.
 * 
 * Also you can use "1.x" to match the newest file with major version 1.
 * And "~1.2.1" which would be the same as ">=1.2.1 <1.3.0".
 * 
 * You can find all the available rules at: https://github.com/npm/node-semver
 * (this is the library we use for version matching)
 * 
 * Rationale: You may be wondering why you should go through the trouble of
 *   specifying mod ranges instead of just giving the newest version that has
 *   been verified to work. The problem is that different mods may have different
 *   compatibility ranges for the same dependency.
 *   Say you have two mods that both depend on SkyUI. One is compatible with
 *   version 3.3 - 5.0, some breakage made it incompatible with 5.1.
 *   The other mod is compatible with all versions >= 4.6.
 *   If both mods specify ranges we can install 5.0 and everybody is happy.
 *   If the second mod specifies only 5.1 as compatible, we have a conflict and
 *   one of the two mods has to be disabled or the user has to find out which
 *   version to use, override and this rendering the complete dependency
 *   information useless.
 * 
 * @export
 * @interface IReference
 */
export interface IReference {
  fileMD5?: string;
  modId?: string;
  versionMatch?: string;
  logicalFileName?: string;
  fileExpression?: string;
}

export type RuleType = 'before' | 'after' | 'requires' | 'conflics' | 'recommends' | 'provides';

/**
 * a rule defining a relation to another mod.
 * The mod can either be specified with a file hash (which will always match
 * the exact same file at the same version) or through an IReference, which
 * can match a file with more complex rules, allowing, for example, to get
 * the newest compatible version of a file.
 * 
 * @export
 * @interface IRule
 */
export interface IRule {
  type: RuleType;
  reference: IReference;
}

/**
 * info about a single file
 * 
 * @export
 * @interface IModInfo
 */
export interface IModInfo {
  modId: string;
  modName: string;
  fileName: string;
  fileSizeBytes: number;
  gameId: string;
  logicalFileName?: string;
  fileVersion: string;
  fileMD5: string;
  sourceURI: any;
  rules?: IRule[];
  details?: {
    homepage?: string;
    category?: string;
    description?: string;
    author?: string;
  };
}

/**
 * result of a lookup call.
 * There may be multiple items returned if the
 * lookup wasn't precise enough
 * 
 * @export
 * @interface ILookupResult
 */
export interface ILookupResult {
  key: string;
  value: IModInfo;
}

export interface IHashResult {
  md5sum: string;
  numBytes: number;
}
