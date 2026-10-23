import { describe, expect, it } from 'vitest';
import { MESSAGES, showCharCounter, submissionFailed } from './messages';

describe('player-facing messages', () => {
  it('tells the player what to do when the code is wrong', () => {
    expect(MESSAGES.codeNotFound).toBe("That code doesn't match a team. Check your event card.");
  });

  it('says what could not be saved, per submission type', () => {
    expect(submissionFailed('photo')).toBe("Couldn't save your photo. Check your signal and try again.");
    expect(submissionFailed('video')).toBe("Couldn't save your video. Check your signal and try again.");
    expect(submissionFailed('answer')).toBe("Couldn't send your answer. Check your signal and try again.");
  });

  it('does not expose internals when the app cannot start', () => {
    expect(MESSAGES.bootFailed).toBe("Urban Rally couldn't start. Check your connection and reload.");
    expect(MESSAGES.bootFailed).not.toMatch(/firebase/i);
  });
});

describe('showCharCounter', () => {
  it('shows the counter only within 50 characters of the limit', () => {
    expect(showCharCounter(494)).toBe(false);
    expect(showCharCounter(51)).toBe(false);
    expect(showCharCounter(50)).toBe(true);
    expect(showCharCounter(0)).toBe(true);
  });
});
