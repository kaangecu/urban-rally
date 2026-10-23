import React, { useId, useState } from 'react';
import { Check, Lightbulb, XCircle } from 'lucide-react';
import { showCharCounter } from '../../utils/messages';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';

interface QuizInputProps {
  question: string;
  type?: 'text' | 'multiple-choice' | 'number';
  options?: string[]; // For multiple choice
  /** The task's own hint, shown after a miss */
  hint?: string;
  onSubmit: (answer: string | number) => void;
  onCancel: () => void;
  maxLength?: number;
  attemptsLeft?: number;
  /** Every answer that was wrong so far, oldest first */
  wrongAnswers?: (string | number)[];
  /** All attempts used */
  failed?: boolean;
}

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F'];

// Checking stays on the phone for now; the Stage 2 functions move it to the server
export const QuizInput: React.FC<QuizInputProps> = ({
  question,
  type = 'text',
  options = [],
  hint,
  onSubmit,
  onCancel,
  maxLength = 500,
  attemptsLeft,
  wrongAnswers = [],
  failed = false,
}) => {
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<string>('');
  const questionId = useId();
  const ruleId = useId();

  const handleSubmit = () => {
    if (type === 'multiple-choice') {
      if (selectedOption) onSubmit(selectedOption);
    } else if (type === 'number') {
      const numAnswer = parseFloat(answer.trim());
      if (!isNaN(numAnswer)) onSubmit(numAnswer);
    } else if (answer.trim()) {
      onSubmit(answer.trim());
    }
  };

  const isValid =
    type === 'multiple-choice'
      ? selectedOption !== ''
      : type === 'number'
        ? !isNaN(parseFloat(answer))
        : answer.trim().length > 0;
  const remainingChars = maxLength - answer.length;
  const missed = wrongAnswers.length > 0;
  const lastWrong = wrongAnswers.at(-1);

  if (failed) {
    return (
      <Sheet
        open
        title="Out of attempts"
        onClose={onCancel}
        footer={
          <Button variant="secondary" block onClick={onCancel}>
            Back to tasks
          </Button>
        }
      >
        <div className="flex items-start gap-3">
          <XCircle className="size-6 shrink-0 text-danger-text" aria-hidden="true" />
          <p>That was the last try, so this quiz gives no points. Pick another task to keep scoring.</p>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open
      title="Quiz"
      onClose={onCancel}
      footer={
        <Button block onClick={handleSubmit} disabled={!isValid}>
          <Check className="size-5" aria-hidden="true" />
          Check answer
        </Button>
      }
    >
      <div className="flex flex-col gap-4 text-text">
        <p id={questionId} className="text-body-lg">{question}</p>

        {/* Mounted empty from the start: screen readers announce changes to a live region, not a new one */}
        {attemptsLeft !== undefined && (
          <p aria-live="polite" className="font-mono text-sm font-bold text-danger-text">
            {missed ? `${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'} left` : ''}
          </p>
        )}

        {missed && hint && (
          <p className="flex items-start gap-2 p-3 rounded-control bg-surface-raised border border-line text-text">
            <Lightbulb className="size-5 shrink-0 text-attention-text" aria-hidden="true" />
            {hint}
          </p>
        )}

        {type === 'multiple-choice' && options.length > 0 && (
          <div role="radiogroup" aria-labelledby={questionId} className="flex flex-col gap-2">
            {options.map((option, index) => {
              const selected = selectedOption === option;
              const wrong = wrongAnswers.includes(option);
              return (
                <label
                  key={option}
                  className={`flex items-center gap-3 min-h-touch px-3 py-2 rounded-control border-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-focus-ring has-[:focus-visible]:outline-offset-2 ${
                    wrong
                      ? 'border-dashed border-danger bg-danger-soft'
                      : selected
                        ? 'border-accent bg-accent-soft cursor-pointer'
                        : 'border-line bg-surface cursor-pointer'
                  }`}
                >
                  <input
                    type="radio"
                    name={questionId}
                    value={option}
                    checked={selected}
                    disabled={wrong}
                    onChange={() => setSelectedOption(option)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`grid place-items-center size-8 shrink-0 rounded-sm border font-mono font-bold ${
                      selected ? 'bg-accent text-on-accent border-accent' : 'border-line-strong text-text-muted'
                    }`}
                  >
                    {KEYS[index] ?? index + 1}
                  </span>
                  <span className="flex-1">{option}</span>
                  {wrong && (
                    <span className="inline-flex items-center gap-1 font-display text-label font-semibold uppercase text-danger-text">
                      <XCircle className="size-4" aria-hidden="true" />
                      Wrong
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        )}

        {(type === 'text' || type === 'number') && (
          <div className="flex flex-col gap-2">
            {type === 'number' ? (
              <input
                type="number"
                inputMode="decimal"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                aria-labelledby={questionId}
                aria-describedby={ruleId}
                className="w-full min-h-control-lg px-4 rounded-control bg-surface border border-line-strong text-text"
                autoFocus
              />
            ) : (
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                maxLength={maxLength}
                aria-labelledby={questionId}
                aria-describedby={ruleId}
                className="w-full px-4 py-3 rounded-control bg-surface border border-line-strong text-text resize-none"
                rows={4}
                autoFocus
              />
            )}
            <p id={ruleId} className="text-sm text-text-muted">
              {type === 'number' ? 'Enter a number.' : "Capitals don't matter and small typos are OK."}
            </p>
            {missed && (
              <p className="text-sm text-danger-text">
                “{String(lastWrong)}” is wrong.
              </p>
            )}
            {type === 'text' && showCharCounter(remainingChars) && (
              <p className="text-sm text-warning-text">{remainingChars} characters left</p>
            )}
          </div>
        )}
      </div>
    </Sheet>
  );
};
