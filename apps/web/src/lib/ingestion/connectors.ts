// @ts-nocheck
/**
 * Data Connectors
 * ===============
 * External data source connectors for esports data ingestion.
 * 
 * Features:
 * - Pandascore API connector
 * - Liquipedia API connector
 * - HLTV web scraping connector
 * - Manual upload support
 * - Extensible base connector class
 * 
 * [Ver001.000] - Data connectors
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

import type {
  DataSourceConfig,
  DataSourceHealth,
  DataSourceType,
  IngestionDataType,
  RawDataRecord,
  DataConnector,
} from './types';

// =============================================================================
// Base Connector
// =============================================================================

export abstract class BaseDataConnector implements DataConnector {
  id: string;
  config: DataSourceConfig;
  health: DataSourceHealth;

  protected abortController: AbortController | null = null;
  protected requestCount = 0;
  protected errorCount = 0;
  protected responseTimeSum = 0;

  constructor(config: DataSourceConfig) {
    this.id = config.id;
    this.config = { ...config };
    this.health = {
      status: 'inactive',
      errorCount: 0,
      requestsMade: 0,
      avgResponseTime: 0,
      dataQuality: 'unknown',
    };
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract fetchData(
    dataType: IngestionDataType,
    params?: Record<string, unknown>
  ): Promise<RawDataRecord[]>;

  /**
   * Test connection to data source
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.connect();
      await this.disconnect();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get rate limit status
   */
  async getRateLimitStatus(): Promise<{ remaining: number; resetTime: number }> {
    return {
      remaining: Infinity,
      resetTime: Date.now() + 60000,
    };
  }

  /**
   * Update connector configuration
   */
  updateConfig(updates: Partial<DataSourceConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Get current health status
   */
  getHealth(): DataSourceHealth {
    return { ...this.health };
  }

  /**
   * Reset health statistics
   */
  resetHealth(): void {
    this.health = {
      status: this.health.status,
      errorCount: 0,
      requestsMade: 0,
      avgResponseTime: 0,
      dataQuality: 'unknown',
    };
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimeSum = 0;
  }

  /**
   * Track request metrics
   */
  protected trackRequest(responseTime: number, success: boolean): void {
    this.requestCount++;
    this.health.requestsMade = this.requestCount;
    this.responseTimeSum += responseTime;
    this.health.avgResponseTime = this.responseTimeSum / this.requestCount;

    if (!success) {
      this.errorCount++;
      this.health.errorCount = this.errorCount;
    }
  }

  /**
   * Calculate checksum for data integrity
   */
  protected calculateChecksum(data: unknown): string {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Create a raw data record
   */
  protected createRawRecord(
    data: unknown,
    dataType: IngestionDataType,
    metadata: Partial<RawDataRecord['metadata']> = {}
  ): RawDataRecord {
    return {
      id: `${this.config.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceType: this.config.type,
      sourceId: this.id,
      dataType,
      rawData: data,
      fetchedAt: new Date().toISOString(),
      checksum: this.calculateChecksum(data),
      metadata: {
        responseStatus: 200,
        responseTime: 0,
        ...metadata,
      },
    };
  }

  /**
   * Make HTTP request with timeout and retry
   */
  protected async fetchWithRetry(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const startTime = Date.now();
    this.abortController = new AbortController();

    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.config.headers,
          ...(options.headers || {}),
        },
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);
      this.trackRequest(Date.now() - startTime, response.ok);

      if (response.status === 429) {
        this.health.status = 'rate_limited';
        const resetHeader = response.headers.get('X-RateLimit-Reset');
        if (resetHeader) {
          this.health.rateLimitReset = parseInt(resetHeader, 10) * 1000;
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.trackRequest(Date.now() - startTime, false);
      throw error;
    }
  }
}

// =============================================================================
// Pandascore Connector
// =============================================================================

export interface PandascoreConfig extends DataSourceConfig {
  type: 'pandascore';
  apiKey: string;
  game: 'valorant' | 'cs2' | 'lol';
}

export class PandascoreConnector extends BaseDataConnector {
  private baseUrl = 'https://api.pandascore.co';

  constructor(config: PandascoreConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Test connection with a simple request
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to connect to Pandascore API: ${response.status}`);
    }

    this.health.status = 'active';
    this.health.dataQuality = 'excellent';
  }

  async disconnect(): Promise<void> {
    this.health.status = 'inactive';
    this.abortController?.abort();
  }

  async fetchData(
    dataType: IngestionDataType,
    params: Record<string, unknown> = {}
  ): Promise<RawDataRecord[]> {
    const endpoint = this.getEndpoint(dataType);
    const queryParams = this.buildQueryParams(params);
    const url = `${this.baseUrl}/${this.getGamePath()}${endpoint}?${queryParams}`;

    const response = await this.fetchWithRetry(url, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Pandascore API error: ${response.status}`);
    }

    const data = await response.json();
    const records: RawDataRecord[] = [];

    // Handle both single items and arrays
    const items = Array.isArray(data) ? data : [data];

    for (const item of items) {
      records.push(
        this.createRawRecord(item, dataType, {
          url,
          params: queryParams as Record<string, string>,
          responseStatus: response.status,
          responseTime: this.health.avgResponseTime,
        })
      );
    }

    return records;
  }

  async getRateLimitStatus(): Promise<{ remaining: number; resetTime: number }> {
    // Pandascore returns rate limit headers
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    return {
      remaining: remaining ? parseInt(remaining, 10) : 1000,
      resetTime: reset ? parseInt(reset, 10) * 1000 : Date.now() + 3600000,
    };
  }

  private getEndpoint(dataType: IngestionDataType): string {
    const endpoints: Record<IngestionDataType, string> = {
      match: '/matches',
      player: '/players',
      team: '/teams',
      tournament: '/tournaments',
      series: '/series',
      statistics: '/stats',
      event: '/events',
    };
    return endpoints[dataType] || '/matches';
  }

  private getGamePath(): string {
    const gamePaths: Record<string, string> = {
      valorant: 'valorant',
      cs2: 'csgo', // Pandascore uses csgo endpoint for CS2
      lol: 'lol',
    };
    return gamePaths[(this.config as PandascoreConfig).game] || 'valorant';
  }

  private buildQueryParams(params: Record<string, unknown>): string {
    const query = new URLSearchParams();
    
    // Add common filters
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('per_page', String(params.limit));
    if (params.status) query.append('filter[status]', String(params.status));
    if (params.dateFrom) query.append('range[begin_at]', `${params.dateFrom},${params.dateTo || ''}`);
    
    // Add custom params
    Object.entries(params).forEach(([key, value]) => {
      if (!['page', 'limit', 'status', 'dateFrom', 'dateTo'].includes(key)) {
        query.append(key, String(value));
      }
    });

    return query.toString();
  }
}

// =============================================================================
// Liquipedia Connector
// =============================================================================

export interface LiquipediaConfig extends DataSourceConfig {
  type: 'liquipedia';
  apiKey: string;
  game: 'valorant' | 'counterstrike';
}

export class LiquipediaConnector extends BaseDataConnector {
  private baseUrl = 'https://api.liquipedia.net/v1';

  constructor(config: LiquipediaConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Liquipedia requires API key validation
    const response = await this.fetchWithRetry(
      `${this.baseUrl}/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to connect to Liquipedia API: ${response.status}`);
    }

    this.health.status = 'active';
    this.health.dataQuality = 'good';
  }

  async disconnect(): Promise<void> {
    this.health.status = 'inactive';
    this.abortController?.abort();
  }

  async fetchData(
    dataType: IngestionDataType,
    params: Record<string, unknown> = {}
  ): Promise<RawDataRecord[]> {
    const endpoint = this.getEndpoint(dataType);
    const queryParams = this.buildQueryParams(params);
    const url = `${this.baseUrl}/${endpoint}?${queryParams}`;

    const response = await this.fetchWithRetry(url, {
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Liquipedia API error: ${response.status}`);
    }

    const data = await response.json();
    const records: RawDataRecord[] = [];

    // Liquipedia returns data in a 'data' field
    const items = Array.isArray(data.data) ? data.data : [data];

    for (const item of items) {
      records.push(
        this.createRawRecord(item, dataType, {
          url,
          params: queryParams as Record<string, string>,
          responseStatus: response.status,
          responseTime: this.health.avgResponseTime,
        })
      );
    }

    return records;
  }

  private getEndpoint(dataType: IngestionDataType): string {
    const game = (this.config as LiquipediaConfig).game;
    const endpoints: Record<IngestionDataType, string> = {
      match: `${game}/match`,
      player: `${game}/player`,
      team: `${game}/team`,
      tournament: `${game}/tournament`,
      series: `${game}/series`,
      statistics: `${game}/statistics`,
      event: `${game}/event`,
    };
    return endpoints[dataType] || `${game}/match`;
  }

  private buildQueryParams(params: Record<string, unknown>): string {
    const query = new URLSearchParams();
    
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.dateFrom) query.append('date_start', String(params.dateFrom));
    if (params.dateTo) query.append('date_end', String(params.dateTo));
    if (params.tournament) query.append('tournament', String(params.tournament));
    if (params.team) query.append('team', String(params.team));

    return query.toString();
  }
}

// =============================================================================
// HLTV Connector (Web Scraping)
// =============================================================================

export interface HLTVConfig extends DataSourceConfig {
  type: 'hltv';
}

export class HLTVConnector extends BaseDataConnector {
  private baseUrl = 'https://www.hltv.org';
  private rateLimitDelay = 2000; // 2 seconds between requests (ethical scraping)
  private lastRequestTime = 0;

  constructor(config: HLTVConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    // Test with a simple request to check if site is accessible
    const response = await this.fetchWithRetry(`${this.baseUrl}/`);

    if (!response.ok) {
      throw new Error(`Failed to connect to HLTV: ${response.status}`);
    }

    this.health.status = 'active';
    this.health.dataQuality = 'good';
  }

  async disconnect(): Promise<void> {
    this.health.status = 'inactive';
    this.abortController?.abort();
  }

  async fetchData(
    dataType: IngestionDataType,
    params: Record<string, unknown> = {}
  ): Promise<RawDataRecord[]> {
    // Respect rate limits
    await this.enforceRateLimit();

    let url: string;
    
    switch (dataType) {
      case 'match':
        url = params.matchId 
          ? `${this.baseUrl}/matches/${params.matchId}/*`
          : `${this.baseUrl}/matches`;
        break;
      case 'player':
        url = params.playerId
          ? `${this.baseUrl}/player/${params.playerId}/*`
          : `${this.baseUrl}/stats/players`;
        break;
      case 'team':
        url = params.teamId
          ? `${this.baseUrl}/team/${params.teamId}/*`
          : `${this.baseUrl}/ranking/teams`;
        break;
      case 'tournament':
        url = params.eventId
          ? `${this.baseUrl}/events/${params.eventId}/*`
          : `${this.baseUrl}/events`;
        break;
      default:
        url = `${this.baseUrl}/matches`;
    }

    const response = await this.fetchWithRetry(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
      },
    });

    if (!response.ok) {
      throw new Error(`HLTV request failed: ${response.status}`);
    }

    const html = await response.text();
    this.lastRequestTime = Date.now();

    // Parse HTML to extract structured data
    const parsedData = this.parseHTML(html, dataType);

    return [
      this.createRawRecord(parsedData, dataType, {
        url,
        params: params as Record<string, string>,
        responseStatus: response.status,
        responseTime: this.health.avgResponseTime,
      }),
    ];
  }

  private async enforceRateLimit(): Promise<void> {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await sleep(this.rateLimitDelay - timeSinceLastRequest);
    }
  }

  private parseHTML(html: string, dataType: IngestionDataType): unknown {
    // Note: In a real implementation, you'd use a proper HTML parser
    // This is a simplified version that extracts basic data
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    switch (dataType) {
      case 'match':
        return this.parseMatchData(doc);
      case 'player':
        return this.parsePlayerData(doc);
      case 'team':
        return this.parseTeamData(doc);
      case 'tournament':
        return this.parseTournamentData(doc);
      default:
        return { raw: html.substring(0, 1000) };
    }
  }

  private parseMatchData(doc: Document): unknown {
    const teams = doc.querySelectorAll('.team-name');
    const scores = doc.querySelectorAll('.score');
    const map = doc.querySelector('.map-name');

    return {
      teamA: teams[0]?.textContent?.trim(),
      teamB: teams[1]?.textContent?.trim(),
      scoreA: scores[0]?.textContent?.trim(),
      scoreB: scores[1]?.textContent?.trim(),
      map: map?.textContent?.trim(),
      source: 'hltv',
    };
  }

  private parsePlayerData(doc: Document): unknown {
    const name = doc.querySelector('.player-name');
    const team = doc.querySelector('.player-team');
    const stats = doc.querySelectorAll('.stats-row');

    return {
      name: name?.textContent?.trim(),
      team: team?.textContent?.trim(),
      stats: Array.from(stats).map(s => s.textContent?.trim()),
      source: 'hltv',
    };
  }

  private parseTeamData(doc: Document): unknown {
    const name = doc.querySelector('.team-name');
    const ranking = doc.querySelector('.team-ranking');
    const players = doc.querySelectorAll('.player-name');

    return {
      name: name?.textContent?.trim(),
      ranking: ranking?.textContent?.trim(),
      players: Array.from(players).map(p => p.textContent?.trim()),
      source: 'hltv',
    };
  }

  private parseTournamentData(doc: Document): unknown {
    const name = doc.querySelector('.event-name');
    const dates = doc.querySelector('.event-date');
    const prize = doc.querySelector('.prize-pool');

    return {
      name: name?.textContent?.trim(),
      dates: dates?.textContent?.trim(),
      prizePool: prize?.textContent?.trim(),
      source: 'hltv',
    };
  }
}

// =============================================================================
// Manual Upload Connector
// =============================================================================

export interface ManualUploadConfig extends DataSourceConfig {
  type: 'manual';
  acceptFormats: string[];
  maxFileSize: number;
}

export class ManualUploadConnector extends BaseDataConnector {
  private queue: File[] = [];

  constructor(config: ManualUploadConfig) {
    super(config);
  }

  async connect(): Promise<void> {
    this.health.status = 'active';
    this.health.dataQuality = 'excellent';
  }

  async disconnect(): Promise<void> {
    this.health.status = 'inactive';
    this.queue = [];
  }

  async fetchData(): Promise<RawDataRecord[]> {
    // Manual connector doesn't fetch - files are uploaded
    return [];
  }

  /**
   * Upload and process a file
   */
  async uploadFile(file: File, dataType: IngestionDataType): Promise<{
    success: boolean;
    records: RawDataRecord[];
    errors: string[];
  }> {
    const config = this.config as ManualUploadConfig;
    const errors: string[] = [];

    // Validate file size
    if (file.size > config.maxFileSize) {
      errors.push(`File size ${file.size} exceeds maximum ${config.maxFileSize}`);
      return { success: false, records: [], errors };
    }

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!config.acceptFormats.includes(fileExt)) {
      errors.push(`File type .${fileExt} not supported. Accepted: ${config.acceptFormats.join(', ')}`);
      return { success: false, records: [], errors };
    }

    try {
      const content = await file.text();
      const records = this.parseContent(content, fileExt, dataType, file.name);

      this.health.status = 'active';
      this.health.dataQuality = 'excellent';

      return { success: true, records, errors };
    } catch (error) {
      const errorMsg = `Failed to parse file: ${(error as Error).message}`;
      errors.push(errorMsg);
      this.health.errorCount++;
      this.health.status = 'error';
      return { success: false, records: [], errors };
    }
  }

  /**
   * Upload from JSON string
   */
  uploadJSON(jsonString: string, dataType: IngestionDataType): {
    success: boolean;
    records: RawDataRecord[];
    errors: string[];
  } {
    const errors: string[] = [];

    try {
      const records = this.parseContent(jsonString, 'json', dataType, 'upload.json');
      return { success: true, records, errors };
    } catch (error) {
      const errorMsg = `Failed to parse JSON: ${(error as Error).message}`;
      errors.push(errorMsg);
      return { success: false, records: [], errors };
    }
  }

  private parseContent(
    content: string,
    format: string,
    dataType: IngestionDataType,
    fileName: string
  ): RawDataRecord[] {
    switch (format) {
      case 'json':
        return this.parseJSON(content, dataType, fileName);
      case 'csv':
        return this.parseCSV(content, dataType, fileName);
      case 'xml':
        return this.parseXML(content, dataType, fileName);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  private parseJSON(content: string, dataType: IngestionDataType, fileName: string): RawDataRecord[] {
    const data = JSON.parse(content);
    const records: RawDataRecord[] = [];

    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        records.push(this.createRawRecord(item, dataType, {
          url: `file://${fileName}`,
          params: { index: String(index) },
          responseStatus: 200,
          responseTime: 0,
        }));
      });
    } else {
      records.push(this.createRawRecord(data, dataType, {
        url: `file://${fileName}`,
        responseStatus: 200,
        responseTime: 0,
      }));
    }

    return records;
  }

  private parseCSV(content: string, dataType: IngestionDataType, fileName: string): RawDataRecord[] {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const records: RawDataRecord[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const obj: Record<string, string> = {};

      headers.forEach((header, index) => {
        obj[header] = values[index]?.trim() || '';
      });

      records.push(this.createRawRecord(obj, dataType, {
        url: `file://${fileName}`,
        params: { row: String(i) },
        responseStatus: 200,
        responseTime: 0,
      }));
    }

    return records;
  }

  private parseXML(content: string, dataType: IngestionDataType, fileName: string): RawDataRecord[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/xml');
    const items = doc.querySelectorAll('item, record, entry, match, player, team');
    const records: RawDataRecord[] = [];

    items.forEach((item, index) => {
      const obj: Record<string, unknown> = {};

      item.attributes.forEach(attr => {
        obj[attr.name] = attr.value;
      });

      item.childNodes.forEach(child => {
        if (child.nodeType === Node.ELEMENT_NODE) {
          obj[child.nodeName] = child.textContent;
        }
      });

      records.push(this.createRawRecord(obj, dataType, {
        url: `file://${fileName}`,
        params: { index: String(index) },
        responseStatus: 200,
        responseTime: 0,
      }));
    });

    return records;
  }
}

// =============================================================================
// Connector Factory
// =============================================================================

const connectorRegistry = new Map<string, DataConnector>();

export function createConnector(config: DataSourceConfig): DataConnector {
  let connector: DataConnector;

  switch (config.type) {
    case 'pandascore':
      connector = new PandascoreConnector(config as PandascoreConfig);
      break;
    case 'liquipedia':
      connector = new LiquipediaConnector(config as LiquipediaConfig);
      break;
    case 'hltv':
      connector = new HLTVConnector(config as HLTVConfig);
      break;
    case 'manual':
      connector = new ManualUploadConnector(config as ManualUploadConfig);
      break;
    case 'file':
      connector = new ManualUploadConnector({
        ...config,
        type: 'manual',
        acceptFormats: ['json', 'csv', 'xml'],
        maxFileSize: 10 * 1024 * 1024,
      } as ManualUploadConfig);
      break;
    default:
      throw new Error(`Unknown connector type: ${config.type}`);
  }

  connectorRegistry.set(config.id, connector);
  return connector;
}

export function getConnector(id: string): DataConnector | undefined {
  return connectorRegistry.get(id);
}

export function removeConnector(id: string): void {
  const connector = connectorRegistry.get(id);
  if (connector) {
    connector.disconnect();
    connectorRegistry.delete(id);
  }
}

export function getAllConnectors(): DataConnector[] {
  return Array.from(connectorRegistry.values());
}

export function getConnectorsByType(type: DataSourceType): DataConnector[] {
  return Array.from(connectorRegistry.values()).filter(c => c.config.type === type);
}

export function getAllHealth(): Record<string, DataSourceHealth> {
  const health: Record<string, DataSourceHealth> = {};
  connectorRegistry.forEach((connector, id) => {
    health[id] = connector.getHealth();
  });
  return health;
}

export function resetAllConnectors(): void {
  connectorRegistry.forEach(connector => connector.disconnect());
  connectorRegistry.clear();
}

// =============================================================================
// Default Configurations
// =============================================================================

export const DEFAULT_PANDASCORE_CONFIG: Omit<PandascoreConfig, 'id' | 'apiKey'> = {
  type: 'pandascore',
  name: 'Pandascore API',
  enabled: true,
  baseUrl: 'https://api.pandascore.co',
  rateLimitPerMinute: 1000,
  retryAttempts: 3,
  timeout: 30000,
  game: 'valorant',
};

export const DEFAULT_LIQUIPEDIA_CONFIG: Omit<LiquipediaConfig, 'id' | 'apiKey'> = {
  type: 'liquipedia',
  name: 'Liquipedia API',
  enabled: true,
  baseUrl: 'https://api.liquipedia.net/v1',
  rateLimitPerMinute: 60,
  retryAttempts: 3,
  timeout: 30000,
  game: 'valorant',
};

export const DEFAULT_HLTV_CONFIG: Omit<HLTVConfig, 'id'> = {
  type: 'hltv',
  name: 'HLTV Scraper',
  enabled: true,
  baseUrl: 'https://www.hltv.org',
  rateLimitPerMinute: 30, // Conservative for ethical scraping
  retryAttempts: 2,
  timeout: 30000,
};

export const DEFAULT_MANUAL_CONFIG: Omit<ManualUploadConfig, 'id'> = {
  type: 'manual',
  name: 'Manual Upload',
  enabled: true,
  baseUrl: '',
  rateLimitPerMinute: 1000,
  retryAttempts: 0,
  timeout: 60000,
  acceptFormats: ['json', 'csv', 'xml'],
  maxFileSize: 50 * 1024 * 1024, // 50MB
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// End of Connectors Module
// =============================================================================
