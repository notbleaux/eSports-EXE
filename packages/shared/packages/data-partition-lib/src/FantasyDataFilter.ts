/**
 * FIREWALL: Blocks game-internal data from reaching the web platform.
 *
 * This is the primary enforcement class for the SATOR data partition.
 * Every data path from the game to the web MUST pass through this filter.
 *
 * See docs/FIREWALL_POLICY.md for the full policy and rationale.
 */
export class FantasyDataFilter {
  /**
   * Fields that exist exclusively inside the game simulation and must
   * never be transmitted to the web platform or stored in the public DB.
   */
  static GAME_ONLY_FIELDS = new Set([
    'internalAgentState',
    'radarData',
    'detailedReplayFrameData',
    'simulationTick',
    'seedValue',
    'visionConeData',
    'smokeTickData',
    'recoilPattern',
  ]);

  /**
   * Recursively sanitize a value, removing all GAME_ONLY_FIELDS at every depth.
   */
  private static deepSanitize(value: unknown): unknown {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => FantasyDataFilter.deepSanitize(item));
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (!FantasyDataFilter.GAME_ONLY_FIELDS.has(key)) {
        result[key] = FantasyDataFilter.deepSanitize((value as Record<string, unknown>)[key]);
      }
    }
    return result;
  }

  /**
   * Recursively validate a value, throwing if any GAME_ONLY_FIELD is found.
   * @param value - The value to validate
   * @param path - Dot-path prefix for error messages (e.g. "player")
   */
  private static deepValidate(value: unknown, path: string): void {
    if (value === null || typeof value !== 'object') {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) =>
        FantasyDataFilter.deepValidate(item, path ? `${path}[${i}]` : `[${i}]`)
      );
      return;
    }
    for (const key of Object.keys(value as Record<string, unknown>)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (FantasyDataFilter.GAME_ONLY_FIELDS.has(key)) {
        throw new Error(`Web attempted to write game-internal field: ${fullPath}`);
      }
      FantasyDataFilter.deepValidate((value as Record<string, unknown>)[key], fullPath);
    }
  }

  /**
   * Sanitize a game data object before sending it to the web platform.
   *
   * Performs a deep clone and recursively removes all GAME_ONLY_FIELDS at
   * every level of nesting, including inside arrays and nested objects.
   *
   * @param gameData - Raw data object from the game simulation
   * @returns A sanitized copy safe for web consumption
   */
  static sanitizeForWeb(gameData: any): any {
    // Deep clone first to avoid mutating the original, then recursively strip.
    const cloned = JSON.parse(JSON.stringify(gameData));
    return FantasyDataFilter.deepSanitize(cloned);
  }

  /**
   * Validate that incoming web data does not contain game-internal fields.
   *
   * Recursively checks all levels of nesting including arrays. Throws an error
   * with the full dot-path of the first forbidden field found.
   *
   * @param webData - Data received from or destined for the web layer
   * @returns `true` if all fields are valid
   * @throws Error with dot-path if a forbidden field is detected
   */
  static validateWebInput(webData: any): boolean {
    FantasyDataFilter.deepValidate(webData, '');
    return true;
  }
}
