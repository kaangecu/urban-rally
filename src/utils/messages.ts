/**
 * Player-facing messages: what happened and what the player can do.
 */

const BOOT_TITLE = "Urban Rally couldn't start";
const BOOT_TEXT = 'Check your connection and reload.';

export const MESSAGES = {
  joinSubtitle: 'Join your team',
  codeNotFound: "That code doesn't match a team. Check your event card.",
  joinFailed: "Couldn't join right now. Check your signal and try again.",
  bootFailed: `${BOOT_TITLE}. ${BOOT_TEXT}`,
  bootFailedTitle: BOOT_TITLE,
  bootFailedText: BOOT_TEXT,
} as const;

export function submissionFailed(kind: 'photo' | 'video' | 'answer'): string {
  const verb = kind === 'answer' ? 'send' : 'save';
  return `Couldn't ${verb} your ${kind}. Check your signal and try again.`;
}

/** Show the text-answer counter only when the player is close to the limit. */
export function showCharCounter(remaining: number): boolean {
  return remaining <= 50;
}
