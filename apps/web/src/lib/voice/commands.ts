/** [Ver001.000]
 * Voice Command Mapping System
 * 
 * Central command registry with navigation, action, and lens commands.
 * Supports multi-language voice commands with conflict resolution.
 */

import type {
  VoiceCommand,
  CommandCategory,
  SupportedLanguage,
  CommandMatch,
  CommandMatchResult,
  CommandConflict,
  NavigationTarget,
  LensCommandConfig,
} from './types';

// ============================================================================
// Navigation Targets (Populated from Knowledge Graph)
// ============================================================================

export const NAVIGATION_TARGETS: NavigationTarget[] = [
  {
    path: '/',
    name: 'Home',
    voicePhrases: {
      en: ['home', 'go home', 'main page', 'dashboard'],
      es: ['inicio', 'página principal', 'tablero'],
      fr: ['accueil', 'page principale', 'tableau de bord'],
      de: ['startseite', 'hauptseite', 'dashboard'],
      jp: ['ホーム', 'メインページ', 'ダッシュボード'],
    },
  },
  {
    path: '/hub/sator',
    name: 'SATOR Analytics',
    hubId: 'hub-1',
    voicePhrases: {
      en: ['sator', 'analytics', 'go to sator', 'open sator', 'player stats', 'ratings'],
      es: ['sator', 'analíticas', 'ir a sator', 'estadísticas'],
      fr: ['sator', 'analytiques', 'aller à sator', 'statistiques'],
      de: ['sator', 'analytik', 'zu sator gehen', 'statistiken'],
      jp: ['サトル', '分析', 'プレイヤー統計'],
    },
  },
  {
    path: '/hub/rotas',
    name: 'ROTAS Simulation',
    hubId: 'hub-2',
    voicePhrases: {
      en: ['rotas', 'simulation', 'go to rotas', 'open rotas', 'matches', 'games'],
      es: ['rotas', 'simulación', 'partidos', 'juegos'],
      fr: ['rotas', 'simulation', 'matchs', 'jeux'],
      de: ['rotas', 'simulation', 'spiele', 'matches'],
      jp: ['ロータス', 'シミュレーション', '試合'],
    },
  },
  {
    path: '/hub/arepo',
    name: 'AREPO Academy',
    hubId: 'hub-3',
    voicePhrases: {
      en: ['arepo', 'academy', 'go to arepo', 'training', 'learn', 'education'],
      es: ['arepo', 'academia', 'entrenamiento', 'aprender'],
      fr: ['arepo', 'académie', 'formation', 'apprendre'],
      de: ['arepo', 'akademie', 'training', 'lernen'],
      jp: ['アレポ', 'アカデミー', 'トレーニング'],
    },
  },
  {
    path: '/hub/opera',
    name: 'OPERA Operations',
    hubId: 'hub-4',
    voicePhrases: {
      en: ['opera', 'operations', 'go to opera', 'teams', 'management'],
      es: ['opera', 'operaciones', 'equipos', 'gestión'],
      fr: ['opera', 'opérations', 'équipes', 'gestion'],
      de: ['opera', 'operationen', 'teams', 'verwaltung'],
      jp: ['オペラ', '運営', 'チーム管理'],
    },
  },
  {
    path: '/hub/tenet',
    name: 'TENET Central',
    hubId: 'hub-5',
    voicePhrases: {
      en: ['tenet', 'central', 'go to tenet', 'main hub', 'center'],
      es: ['tenet', 'central', 'centro', 'hub principal'],
      fr: ['tenet', 'central', 'centre', 'hub principal'],
      de: ['tenet', 'zentral', 'zentrum', 'haupt-hub'],
      jp: ['テネト', '中央', 'メインハブ'],
    },
  },
  {
    path: '/settings',
    name: 'Settings',
    voicePhrases: {
      en: ['settings', 'preferences', 'options', 'configuration'],
      es: ['ajustes', 'preferencias', 'configuración'],
      fr: ['paramètres', 'préférences', 'configuration'],
      de: ['einstellungen', 'präferenzen', 'konfiguration'],
      jp: ['設定', '環境設定', 'オプション'],
    },
  },
  {
    path: '/help',
    name: 'Help Center',
    voicePhrases: {
      en: ['help', 'support', 'assistance', 'guide'],
      es: ['ayuda', 'soporte', 'asistencia', 'guía'],
      fr: ['aide', 'support', 'assistance', 'guide'],
      de: ['hilfe', 'support', 'unterstützung', 'anleitung'],
      jp: ['ヘルプ', 'サポート', 'ガイド'],
    },
  },
  {
    path: '/search',
    name: 'Search',
    voicePhrases: {
      en: ['search', 'find', 'lookup', 'query'],
      es: ['buscar', 'encontrar', 'búsqueda'],
      fr: ['rechercher', 'trouver', 'recherche'],
      de: ['suchen', 'finden', 'suche'],
      jp: ['検索', '探す', 'サーチ'],
    },
  },
];

// ============================================================================
// Lens Commands (Populated from Lens Framework)
// ============================================================================

export const LENS_COMMANDS: LensCommandConfig[] = [
  {
    lensId: 'heatmap',
    action: 'toggle',
    phrases: {
      en: ['show heatmap', 'toggle heatmap', 'heatmap', 'heat map'],
      es: ['mostrar mapa de calor', 'mapa de calor', 'activar mapa de calor'],
      fr: ['afficher la carte thermique', 'carte thermique', 'activer carte thermique'],
      de: ['heatmap anzeigen', 'heatmap umschalten', 'heatmap'],
      jp: ['ヒートマップ表示', 'ヒートマップ', 'ヒートマップ切り替え'],
    },
  },
  {
    lensId: 'trajectories',
    action: 'toggle',
    phrases: {
      en: ['show trajectories', 'toggle trajectories', 'trajectories', 'movement paths'],
      es: ['mostrar trayectorias', 'trayectorias', 'rutas de movimiento'],
      fr: ['afficher trajectoires', 'trajectoires', 'chemins de mouvement'],
      de: ['trajektorien anzeigen', 'trajektorien', 'bewegungspfade'],
      jp: ['軌跡表示', '軌跡', '移動パス'],
    },
  },
  {
    lensId: 'vision-cones',
    action: 'toggle',
    phrases: {
      en: ['show vision cones', 'toggle vision', 'vision cones', 'line of sight'],
      es: ['mostrar conos de visión', 'conos de visión', 'línea de visión'],
      fr: ['afficher cônes de vision', 'cônes de vision', 'ligne de vue'],
      de: ['sichtkegel anzeigen', 'sichtkegel', 'sichtlinie'],
      jp: ['視界コーン表示', '視界コーン', '視線'],
    },
  },
  {
    lensId: 'utility',
    action: 'toggle',
    phrases: {
      en: ['show utility', 'toggle utility', 'utility usage', 'grenades'],
      es: ['mostrar utilidad', 'utilidad', 'granadas'],
      fr: ['afficher utilitaires', 'utilitaires', 'grenades'],
      de: ['utility anzeigen', 'utility', 'granaten'],
      jp: ['ユーティリティ表示', 'ユーティリティ', 'グレネード'],
    },
  },
  {
    lensId: 'economy',
    action: 'toggle',
    phrases: {
      en: ['show economy', 'toggle economy', 'economy view', 'money', 'credits'],
      es: ['mostrar economía', 'economía', 'dinero', 'créditos'],
      fr: ['afficher économie', 'économie', 'argent', 'crédits'],
      de: ['ökonomie anzeigen', 'ökonomie', 'geld', 'credits'],
      jp: ['エコノミー表示', 'エコノミー', 'お金', 'クレジット'],
    },
  },
  {
    lensId: 'timing',
    action: 'toggle',
    phrases: {
      en: ['show timing', 'toggle timing', 'timing analysis', 'round timer'],
      es: ['mostrar tiempo', 'tiempo', 'análisis de tiempo', 'temporizador'],
      fr: ['afficher timing', 'timing', 'analyse temporelle', 'minuteur'],
      de: ['timing anzeigen', 'timing', 'zeitanalyse', 'runden-timer'],
      jp: ['タイミング表示', 'タイミング', '時間分析', 'ラウンドタイマー'],
    },
  },
];

// ============================================================================
// Action Commands
// ============================================================================

export const ACTION_COMMANDS: VoiceCommand[] = [
  {
    id: 'action:search',
    category: 'action',
    phrase: 'search',
    translations: {
      en: ['search', 'find', 'look for', 'search for'],
      es: ['buscar', 'encontrar', 'buscar por'],
      fr: ['rechercher', 'trouver', 'chercher'],
      de: ['suchen', 'finden', 'suche nach'],
      jp: ['検索', '探す', 'サーチ'],
    },
    description: 'Open search interface',
    priority: 100,
    keyboardShortcut: '/',
  },
  {
    id: 'action:help',
    category: 'action',
    phrase: 'help',
    translations: {
      en: ['help', 'what can I say', 'voice commands', 'show commands'],
      es: ['ayuda', 'qué puedo decir', 'comandos de voz', 'mostrar comandos'],
      fr: ['aide', 'que puis-je dire', 'commandes vocales', 'afficher commandes'],
      de: ['hilfe', 'was kann ich sagen', 'sprachbefehle', 'befehle anzeigen'],
      jp: ['ヘルプ', '何が言える', '音声コマンド', 'コマンド表示'],
    },
    description: 'Show available voice commands',
    priority: 95,
    keyboardShortcut: '?',
  },
  {
    id: 'action:back',
    category: 'action',
    phrase: 'back',
    translations: {
      en: ['back', 'go back', 'previous', 'return'],
      es: ['atrás', 'volver', 'anterior', 'regresar'],
      fr: ['retour', 'précédent', 'revenir'],
      de: ['zurück', 'zurückgehen', 'vorherige', 'zurückkehren'],
      jp: ['戻る', 'バック', '前へ', '戻って'],
    },
    description: 'Navigate to previous page',
    priority: 90,
    keyboardShortcut: 'Alt+Left',
  },
  {
    id: 'action:close',
    category: 'action',
    phrase: 'close',
    translations: {
      en: ['close', 'exit', 'dismiss', 'cancel'],
      es: ['cerrar', 'salir', 'descartar', 'cancelar'],
      fr: ['fermer', 'quitter', 'annuler'],
      de: ['schließen', 'beenden', 'abbrechen'],
      jp: ['閉じる', '終了', 'キャンセル'],
    },
    description: 'Close current modal or panel',
    priority: 85,
    keyboardShortcut: 'Escape',
  },
  {
    id: 'action:refresh',
    category: 'action',
    phrase: 'refresh',
    translations: {
      en: ['refresh', 'reload', 'update', 'sync'],
      es: ['actualizar', 'recargar', 'sincronizar'],
      fr: ['actualiser', 'recharger', 'mettre à jour'],
      de: ['aktualisieren', 'neu laden', 'synchronisieren'],
      jp: ['更新', '再読み込み', '同期'],
    },
    description: 'Refresh current page data',
    priority: 80,
    keyboardShortcut: 'F5',
  },
  {
    id: 'action:fullscreen',
    category: 'action',
    phrase: 'fullscreen',
    translations: {
      en: ['fullscreen', 'full screen', 'maximize', 'expand'],
      es: ['pantalla completa', 'maximizar', 'expandir'],
      fr: ['plein écran', 'maximiser', 'agrandir'],
      de: ['vollbild', 'maximieren', 'erweitern'],
      jp: ['全画面', '最大化', '拡大'],
    },
    description: 'Toggle fullscreen mode',
    priority: 75,
    keyboardShortcut: 'F11',
  },
  {
    id: 'action:scroll-up',
    category: 'action',
    phrase: 'scroll up',
    translations: {
      en: ['scroll up', 'up', 'move up', 'page up'],
      es: ['desplazar arriba', 'arriba', 'subir', 'página arriba'],
      fr: ['défiler vers le haut', 'haut', 'monter', 'page précédente'],
      de: ['nach oben scrollen', 'hoch', 'rauf', 'seite hoch'],
      jp: ['上にスクロール', '上へ', 'ページアップ'],
    },
    description: 'Scroll page up',
    priority: 70,
    keyboardShortcut: 'PageUp',
  },
  {
    id: 'action:scroll-down',
    category: 'action',
    phrase: 'scroll down',
    translations: {
      en: ['scroll down', 'down', 'move down', 'page down'],
      es: ['desplazar abajo', 'abajo', 'bajar', 'página abajo'],
      fr: ['défiler vers le bas', 'bas', 'descendre', 'page suivante'],
      de: ['nach unten scrollen', 'runter', 'nach unten', 'seite runter'],
      jp: ['下にスクロール', '下へ', 'ページダウン'],
    },
    description: 'Scroll page down',
    priority: 70,
    keyboardShortcut: 'PageDown',
  },
];

// ============================================================================
// System Commands
// ============================================================================

export const SYSTEM_COMMANDS: VoiceCommand[] = [
  {
    id: 'system:language-en',
    category: 'system',
    phrase: 'switch to English',
    translations: {
      en: ['switch to English', 'English', 'use English'],
      es: ['cambiar a inglés', 'inglés', 'usar inglés'],
      fr: ['passer à l\'anglais', 'anglais', 'utiliser anglais'],
      de: ['zu Englisch wechseln', 'Englisch', 'Englisch verwenden'],
      jp: ['英語に切り替え', '英語', '英語を使用'],
    },
    description: 'Switch voice recognition to English',
    priority: 100,
  },
  {
    id: 'system:language-es',
    category: 'system',
    phrase: 'switch to Spanish',
    translations: {
      en: ['switch to Spanish', 'Spanish', 'use Spanish', 'Español'],
      es: ['cambiar a español', 'español', 'usar español'],
      fr: ['passer à l\'espagnol', 'espagnol', 'utiliser espagnol'],
      de: ['zu Spanisch wechseln', 'Spanisch', 'Spanisch verwenden'],
      jp: ['スペイン語に切り替え', 'スペイン語', 'スペイン語を使用'],
    },
    description: 'Switch voice recognition to Spanish',
    priority: 100,
  },
  {
    id: 'system:language-fr',
    category: 'system',
    phrase: 'switch to French',
    translations: {
      en: ['switch to French', 'French', 'use French', 'Français'],
      es: ['cambiar a francés', 'francés', 'usar francés'],
      fr: ['passer au français', 'français', 'utiliser français'],
      de: ['zu Französisch wechseln', 'Französisch', 'Französisch verwenden'],
      jp: ['フランス語に切り替え', 'フランス語', 'フランス語を使用'],
    },
    description: 'Switch voice recognition to French',
    priority: 100,
  },
  {
    id: 'system:language-de',
    category: 'system',
    phrase: 'switch to German',
    translations: {
      en: ['switch to German', 'German', 'use German', 'Deutsch'],
      es: ['cambiar a alemán', 'alemán', 'usar alemán'],
      fr: ['passer à l\'allemand', 'allemand', 'utiliser allemand'],
      de: ['zu Deutsch wechseln', 'Deutsch', 'Deutsch verwenden'],
      jp: ['ドイツ語に切り替え', 'ドイツ語', 'ドイツ語を使用'],
    },
    description: 'Switch voice recognition to German',
    priority: 100,
  },
  {
    id: 'system:language-jp',
    category: 'system',
    phrase: 'switch to Japanese',
    translations: {
      en: ['switch to Japanese', 'Japanese', 'use Japanese', '日本語'],
      es: ['cambiar a japonés', 'japonés', 'usar japonés'],
      fr: ['passer au japonais', 'japonais', 'utiliser japonais'],
      de: ['zu Japanisch wechseln', 'Japanisch', 'Japanisch verwenden'],
      jp: ['日本語に切り替え', '日本語', '日本語を使用'],
    },
    description: 'Switch voice recognition to Japanese',
    priority: 100,
  },
  {
    id: 'system:stop',
    category: 'system',
    phrase: 'stop listening',
    translations: {
      en: ['stop listening', 'stop', 'end voice', 'disable voice', 'turn off voice'],
      es: ['dejar de escuchar', 'detener', 'fin de voz', 'desactivar voz'],
      fr: ['arrêter d\'écouter', 'arrêter', 'fin voix', 'désactiver voix'],
      de: ['aufhören zu hören', 'stopp', 'sprache beenden', 'sprache deaktivieren'],
      jp: ['聞くのをやめる', '停止', '音声終了', '音声を無効化'],
    },
    description: 'Stop voice recognition',
    priority: 200,
    keyboardShortcut: 'Escape',
  },
];

// ============================================================================
// Command Registry Class
// ============================================================================

class VoiceCommandRegistry {
  private commands: Map<string, VoiceCommand> = new Map();
  private customCommands: Map<string, VoiceCommand> = new Map();

  constructor() {
    this.initializeDefaultCommands();
  }

  private initializeDefaultCommands(): void {
    // Add action commands
    ACTION_COMMANDS.forEach(cmd => this.commands.set(cmd.id, cmd));
    
    // Add system commands
    SYSTEM_COMMANDS.forEach(cmd => this.commands.set(cmd.id, cmd));
    
    // Generate navigation commands from targets
    NAVIGATION_TARGETS.forEach(target => {
      const navCommand: VoiceCommand = {
        id: `nav:${target.path}`,
        category: 'navigation',
        phrase: `go to ${target.name}`,
        translations: target.voicePhrases,
        description: `Navigate to ${target.name}`,
        priority: 50,
      };
      this.commands.set(navCommand.id, navCommand);
    });
    
    // Generate lens commands from config
    LENS_COMMANDS.forEach(lens => {
      const lensCommand: VoiceCommand = {
        id: `lens:${lens.lensId}:${lens.action}`,
        category: 'lens',
        phrase: `${lens.action} ${lens.lensId}`,
        translations: lens.phrases,
        description: `${lens.action} ${lens.lensId} lens`,
        priority: 60,
      };
      this.commands.set(lensCommand.id, lensCommand);
    });
  }

  /**
   * Register a custom command
   */
  register(command: VoiceCommand): void {
    if (this.commands.has(command.id) || this.customCommands.has(command.id)) {
      console.warn(`[VoiceCommand] Command ${command.id} already exists, overwriting`);
    }
    this.customCommands.set(command.id, command);
  }

  /**
   * Unregister a custom command
   */
  unregister(commandId: string): void {
    this.customCommands.delete(commandId);
  }

  /**
   * Get all commands, optionally filtered by category
   */
  getCommands(category?: CommandCategory): VoiceCommand[] {
    const allCommands = [
      ...this.commands.values(),
      ...this.customCommands.values(),
    ];
    
    if (category) {
      return allCommands.filter(cmd => cmd.category === category);
    }
    
    return allCommands.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get a specific command by ID
   */
  getCommand(commandId: string): VoiceCommand | undefined {
    return this.customCommands.get(commandId) || this.commands.get(commandId);
  }

  /**
   * Match a transcript against available commands
   */
  match(transcript: string, language: SupportedLanguage = 'en'): CommandMatchResult {
    const normalizedTranscript = this.normalizeTranscript(transcript);
    const candidates: CommandMatch[] = [];

    // Check all commands
    const allCommands = this.getCommands();
    
    for (const command of allCommands) {
      const match = this.matchCommand(normalizedTranscript, command, language);
      if (match) {
        candidates.push(match);
      }
    }

    // Sort by confidence (highest first)
    candidates.sort((a, b) => b.confidence - a.confidence);

    if (candidates.length === 0) {
      return { matched: false };
    }

    const bestMatch = candidates[0];
    
    // Only return as matched if confidence is above threshold
    if (bestMatch.confidence >= 0.6) {
      return {
        matched: true,
        match: bestMatch,
        candidates: candidates.slice(0, 5), // Return top 5 candidates
      };
    }

    return {
      matched: false,
      candidates: candidates.slice(0, 3), // Return top 3 for suggestions
    };
  }

  /**
   * Match a single command against transcript
   */
  private matchCommand(
    transcript: string,
    command: VoiceCommand,
    language: SupportedLanguage
  ): CommandMatch | null {
    const phrases = command.translations[language] || command.translations['en'];
    
    let bestConfidence = 0;
    let matchedPhrase = '';

    for (const phrase of phrases) {
      const confidence = this.calculateConfidence(transcript, phrase);
      if (confidence > bestConfidence) {
        bestConfidence = confidence;
        matchedPhrase = phrase;
      }
    }

    // Also check English phrases as fallback for non-English languages
    if (language !== 'en') {
      for (const phrase of command.translations['en']) {
        const confidence = this.calculateConfidence(transcript, phrase) * 0.9; // Slight penalty
        if (confidence > bestConfidence) {
          bestConfidence = confidence;
          matchedPhrase = phrase;
        }
      }
    }

    if (bestConfidence > 0.3) {
      return {
        command,
        confidence: bestConfidence,
        transcript,
      };
    }

    return null;
  }

  /**
   * Calculate confidence score between transcript and phrase
   */
  private calculateConfidence(transcript: string, phrase: string): number {
    const normalizedTranscript = this.normalizeTranscript(transcript);
    const normalizedPhrase = this.normalizeTranscript(phrase);

    // Exact match
    if (normalizedTranscript === normalizedPhrase) {
      return 1.0;
    }

    // Contains full phrase
    if (normalizedTranscript.includes(normalizedPhrase)) {
      return 0.95;
    }

    // Phrase contains transcript (partial match)
    if (normalizedPhrase.includes(normalizedTranscript)) {
      return 0.85;
    }

    // Word-level matching
    const transcriptWords = normalizedTranscript.split(' ');
    const phraseWords = normalizedPhrase.split(' ');
    
    const matchingWords = transcriptWords.filter(word => 
      phraseWords.some(phraseWord => 
        phraseWord === word || 
        phraseWord.startsWith(word) || 
        word.startsWith(phraseWord)
      )
    );

    const wordMatchRatio = matchingWords.length / Math.max(transcriptWords.length, phraseWords.length);
    
    // Boost if key words match at the start
    const startsWithMatch = transcriptWords[0] === phraseWords[0];
    const boost = startsWithMatch ? 0.1 : 0;

    return Math.min(0.8, wordMatchRatio * 0.8 + boost);
  }

  /**
   * Normalize transcript for matching
   */
  private normalizeTranscript(transcript: string): string {
    return transcript
      .toLowerCase()
      .trim()
      .replace(/[.,!?;:]$/, '') // Remove trailing punctuation
      .replace(/\s+/g, ' ');     // Normalize whitespace
  }

  /**
   * Check for command conflicts
   */
  checkConflicts(): CommandConflict[] {
    const conflicts: CommandConflict[] = [];
    const phraseMap = new Map<string, string[]>();

    // Build phrase -> command IDs map
    const allCommands = this.getCommands();
    
    for (const command of allCommands) {
      for (const lang of Object.keys(command.translations) as SupportedLanguage[]) {
        for (const phrase of command.translations[lang]) {
          const normalized = this.normalizeTranscript(phrase);
          const existing = phraseMap.get(normalized) || [];
          if (!existing.includes(command.id)) {
            existing.push(command.id);
          }
          phraseMap.set(normalized, existing);
        }
      }
    }

    // Find conflicts (same phrase for different commands)
    for (const [phrase, commandIds] of phraseMap.entries()) {
      if (commandIds.length > 1) {
        const severity = commandIds.length > 2 ? 'high' : commandIds.length > 1 ? 'medium' : 'low';
        conflicts.push({
          commandIds,
          sharedPhrases: [phrase],
          severity,
        });
      }
    }

    return conflicts;
  }

  /**
   * Get navigation target for a path
   */
  getNavigationTarget(path: string): NavigationTarget | undefined {
    return NAVIGATION_TARGETS.find(t => t.path === path);
  }

  /**
   * Get lens commands for a lens ID
   */
  getLensCommands(lensId: string): LensCommandConfig[] {
    return LENS_COMMANDS.filter(cmd => cmd.lensId === lensId);
  }

  /**
   * Clear all custom commands
   */
  clearCustomCommands(): void {
    this.customCommands.clear();
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const voiceCommandRegistry = new VoiceCommandRegistry();

// ============================================================================
// Utility Exports
// ============================================================================

export function registerVoiceCommand(command: VoiceCommand): void {
  voiceCommandRegistry.register(command);
}

export function unregisterVoiceCommand(commandId: string): void {
  voiceCommandRegistry.unregister(commandId);
}

export function matchVoiceCommand(
  transcript: string,
  language?: SupportedLanguage
): CommandMatchResult {
  return voiceCommandRegistry.match(transcript, language);
}

export function getVoiceCommands(category?: CommandCategory): VoiceCommand[] {
  return voiceCommandRegistry.getCommands(category);
}

export function checkCommandConflicts(): CommandConflict[] {
  return voiceCommandRegistry.checkConflicts();
}

export function getNavigationTargets(): NavigationTarget[] {
  return NAVIGATION_TARGETS;
}

export function getLensCommandConfigs(): LensCommandConfig[] {
  return LENS_COMMANDS;
}
