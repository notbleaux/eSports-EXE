/**
 * [Ver001.000] FantasyDataFilter unit tests — recursive filtering (Phase 10)
 */
import { describe, it, expect } from 'vitest';
import { FantasyDataFilter } from './FantasyDataFilter';

describe('FantasyDataFilter.sanitizeForWeb', () => {
  it('removes top-level forbidden field', () => {
    const result = FantasyDataFilter.sanitizeForWeb({ name: 'Alice', radarData: [1, 2] });
    expect(result).toEqual({ name: 'Alice' });
    expect('radarData' in result).toBe(false);
  });

  it('removes nested forbidden field 2 levels deep', () => {
    const result = FantasyDataFilter.sanitizeForWeb({
      player: { name: 'Bob', seedValue: 42 },
    });
    expect(result.player.name).toBe('Bob');
    expect('seedValue' in result.player).toBe(false);
  });

  it('removes deeply nested forbidden field 3+ levels deep', () => {
    const result = FantasyDataFilter.sanitizeForWeb({
      match: { round: { details: { simulationTick: 999, public: 'ok' } } },
    });
    expect(result.match.round.details.public).toBe('ok');
    expect('simulationTick' in result.match.round.details).toBe(false);
  });

  it('removes forbidden field inside array elements', () => {
    const result = FantasyDataFilter.sanitizeForWeb({
      players: [
        { name: 'P1', visionConeData: 'secret' },
        { name: 'P2', smokeTickData: [] },
      ],
    });
    expect(result.players[0].name).toBe('P1');
    expect('visionConeData' in result.players[0]).toBe(false);
    expect(result.players[1].name).toBe('P2');
    expect('smokeTickData' in result.players[1]).toBe(false);
  });

  it('removes all 8 forbidden fields simultaneously', () => {
    const forbidden = [
      'internalAgentState', 'radarData', 'detailedReplayFrameData',
      'simulationTick', 'seedValue', 'visionConeData', 'smokeTickData', 'recoilPattern',
    ];
    const input: Record<string, unknown> = { public: 'visible' };
    for (const f of forbidden) input[f] = 'secret';
    const result = FantasyDataFilter.sanitizeForWeb(input);
    expect(result.public).toBe('visible');
    for (const f of forbidden) expect(f in result).toBe(false);
  });

  it('preserves safe fields at all depths', () => {
    const result = FantasyDataFilter.sanitizeForWeb({
      a: { b: { c: 'keep' }, d: [{ e: 'keep2' }] },
    });
    expect(result.a.b.c).toBe('keep');
    expect(result.a.d[0].e).toBe('keep2');
  });

  it('passes through primitives and null unchanged', () => {
    expect(FantasyDataFilter.sanitizeForWeb(null)).toBeNull();
    expect(FantasyDataFilter.sanitizeForWeb('string')).toBe('string');
    expect(FantasyDataFilter.sanitizeForWeb(123)).toBe(123);
  });

  it('does not remove fields with similar-but-different names', () => {
    const result = FantasyDataFilter.sanitizeForWeb({
      my_seedValue: 'keep',
      radarData_v2: 'keep',
      simulationTick: 'remove',
    });
    expect(result.my_seedValue).toBe('keep');
    expect(result.radarData_v2).toBe('keep');
    expect('simulationTick' in result).toBe(false);
  });
});

describe('FantasyDataFilter.validateWebInput', () => {
  it('passes for data with no forbidden fields', () => {
    expect(FantasyDataFilter.validateWebInput({ name: 'Alice', acs: 250 })).toBe(true);
  });

  it('throws with the field name for a top-level forbidden field', () => {
    expect(() =>
      FantasyDataFilter.validateWebInput({ radarData: 'secret' })
    ).toThrow('radarData');
  });

  it('throws with the full dot-path for a nested forbidden field', () => {
    expect(() =>
      FantasyDataFilter.validateWebInput({ player: { seedValue: 42 } })
    ).toThrow('player.seedValue');
  });

  it('throws for a forbidden field inside an array element', () => {
    expect(() =>
      FantasyDataFilter.validateWebInput({ players: [{ smokeTickData: [] }] })
    ).toThrow('smokeTickData');
  });

  it('throws for a deeply nested forbidden field', () => {
    expect(() =>
      FantasyDataFilter.validateWebInput({ a: { b: { internalAgentState: {} } } })
    ).toThrow('a.b.internalAgentState');
  });
});
