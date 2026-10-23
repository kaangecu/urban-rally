import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Camera } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from './Badge';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { DifficultyMeter } from './DifficultyMeter';
import { ProgressBar } from './ProgressBar';
import { TaskTypeTag } from './TaskTypeTag';
import { TextField } from './TextField';

describe('Button', () => {
  it('calls onClick when enabled', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Take photo</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and not clickable when disabled', async () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Join</Button>);
    const button = screen.getByRole('button', { name: 'Join' });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('marks itself busy and blocks clicks while loading', async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Join</Button>);
    const button = screen.getByRole('button', { name: /Join/ });
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" so it never submits a form by accident', () => {
    render(<Button>Retake</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('uses the gradient only on the primary variant', () => {
    render(<><Button>Main</Button><Button variant="secondary">Other</Button></>);
    expect(screen.getByRole('button', { name: 'Main' }).className).toContain('bg-gradient-primary');
    expect(screen.getByRole('button', { name: 'Other' }).className).not.toContain('bg-gradient-primary');
  });
});

describe('TextField', () => {
  it('associates the label with the input', () => {
    render(<TextField label="Team code" />);
    expect(screen.getByLabelText('Team code')).toBeInTheDocument();
  });

  it('announces the error and marks the input invalid', () => {
    render(<TextField label="Team code" hint="On your event card" error="That code doesn't match a team." />);
    const input = screen.getByLabelText('Team code');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/That code doesn't match a team\./);
    expect(input).toHaveAccessibleDescription(/On your event card/);
  });
});

describe('Checkbox', () => {
  it('toggles and is labelled', async () => {
    render(<Checkbox label="I accept the Terms and Privacy Policy" />);
    const box = screen.getByRole('checkbox', { name: 'I accept the Terms and Privacy Policy' });
    await userEvent.click(box);
    expect(box).toBeChecked();
  });

  it('announces its error', () => {
    render(<Checkbox label="I accept" error="Please accept to join." />);
    const box = screen.getByRole('checkbox', { name: 'I accept' });
    expect(box).toHaveAttribute('aria-invalid', 'true');
    expect(box).toHaveAccessibleDescription('Please accept to join.');
  });
});

describe('DifficultyMeter', () => {
  it('exposes its level as text for screen readers', () => {
    render(<DifficultyMeter level={2} />);
    expect(screen.getByRole('img', { name: 'Difficulty 2 of 3' })).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('is a progressbar with its value', () => {
    render(<ProgressBar label="Progress" value={1} max={3} valueText="1 / 3 tasks" />);
    const bar = screen.getByRole('progressbar', { name: 'Progress' });
    expect(bar).toHaveAttribute('aria-valuenow', '1');
    expect(bar).toHaveAttribute('aria-valuemax', '3');
    expect(bar).toHaveAttribute('aria-valuetext', '1 / 3 tasks');
  });
});

describe('Badge and TaskTypeTag', () => {
  it('render their text with decorative icons hidden', () => {
    const { container } = render(<><Badge variant="points">+80 pts</Badge><TaskTypeTag label="Photo" Icon={Camera} /></>);
    expect(screen.getByText('+80 pts')).toBeInTheDocument();
    expect(screen.getByText('Photo')).toBeInTheDocument();
    container.querySelectorAll('svg').forEach((svg) => expect(svg).toHaveAttribute('aria-hidden', 'true'));
  });
});
