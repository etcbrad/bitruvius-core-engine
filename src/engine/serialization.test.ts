import { describe, expect, it } from 'vitest';
import { deserializeEngineState, ENGINE_STATE_SCHEMA_V1, serializeEngineState } from './serialization';

describe('engine/serialization', () => {
  it('serializes with schema wrapper', () => {
    const state = { joints: {}, mirroring: true } as any;
    const serialized = serializeEngineState(state);
    const parsed = JSON.parse(serialized);

    expect(parsed.schema).toBe(ENGINE_STATE_SCHEMA_V1);
    expect(parsed.state).toEqual(state);
    expect(typeof parsed.savedAt).toBe('string');
  });

  it('deserializes v1 wrapper and returns rawState', () => {
    const state = { example: true };
    const wrapped = JSON.stringify({
      schema: ENGINE_STATE_SCHEMA_V1,
      savedAt: '2020-01-01T00:00:00.000Z',
      state,
    });

    const result = deserializeEngineState(wrapped);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.schema).toBe(ENGINE_STATE_SCHEMA_V1);
      expect(result.rawState).toEqual(state);
      expect(result.savedAt).toBe('2020-01-01T00:00:00.000Z');
    }
  });

  it('deserializes legacy state shape', () => {
    const legacy = JSON.stringify({ joints: {}, viewMode: 'default' });
    const result = deserializeEngineState(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.schema).toBeNull();
      expect(result.rawState).toEqual({ joints: {}, viewMode: 'default' });
    }
  });

  it('rejects invalid JSON', () => {
    const result = deserializeEngineState('{ nope');
    expect(result.ok).toBe(false);
  });
});

