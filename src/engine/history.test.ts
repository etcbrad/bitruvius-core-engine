import { describe, expect, it } from 'vitest';
import { HistoryController } from './history';

describe('HistoryController', () => {
  it('pushUndo clears redo and enables undo', () => {
    const history = new HistoryController<{ v: number }>({ limit: 10 });
    const s0 = { v: 0 };
    const s1 = { v: 1 };

    history.pushUndo('inc', s0);
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    const undone = history.undo(s1);
    expect(undone).toBe(s0);
    expect(history.canRedo()).toBe(true);

    history.pushUndo('inc2', undone);
    expect(history.canRedo()).toBe(false);
  });

  it('beginAction/commitAction only pushes when state changes', () => {
    const history = new HistoryController<{ v: number }>({ limit: 10 });
    const s0 = { v: 0 };
    const s1 = { v: 1 };

    history.beginAction('drag', s0);
    expect(history.commitAction(s0)).toBe(false);
    expect(history.canUndo()).toBe(false);

    history.beginAction('drag', s0);
    expect(history.commitAction(s1)).toBe(true);
    expect(history.canUndo()).toBe(true);
  });

  it('undo/redo round-trips states', () => {
    const history = new HistoryController<{ v: number }>({ limit: 10 });
    const s0 = { v: 0 };
    const s1 = { v: 1 };
    const s2 = { v: 2 };

    history.pushUndo('set', s0);
    history.pushUndo('set', s1);

    expect(history.undo(s2)).toBe(s1);
    expect(history.undo(s1)).toBe(s0);
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(true);

    expect(history.redo(s0)).toBe(s1);
    expect(history.redo(s1)).toBe(s2);
    expect(history.canRedo()).toBe(false);
  });
});

