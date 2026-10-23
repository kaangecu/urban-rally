import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegalModal } from './LegalModal';
import { TermsOfService } from './TermsOfService';
import { PrivacyPolicy } from './PrivacyPolicy';
import { defaultLegalLang } from './language';

function renderTerms() {
  return render(
    <LegalModal isOpen onClose={() => {}} title={{ en: 'Terms of Service', de: 'Nutzungsbedingungen' }}>
      {(lang) => <TermsOfService lang={lang} />}
    </LegalModal>
  );
}

describe('defaultLegalLang', () => {
  it('picks German for German locales', () => {
    expect(defaultLegalLang('de-DE')).toBe('de');
    expect(defaultLegalLang('de')).toBe('de');
  });

  it('picks English for everything else', () => {
    expect(defaultLegalLang('en-US')).toBe('en');
    expect(defaultLegalLang('fr-FR')).toBe('en');
    expect(defaultLegalLang('')).toBe('en');
  });
});

describe('LegalModal with the Terms of Service', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows only English on an English phone', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    renderTerms();

    expect(screen.getByRole('heading', { name: '1. Scope' })).toBeInTheDocument();
    expect(screen.queryByText(/Anwendungsbereich/)).not.toBeInTheDocument();
  });

  it('shows only German on a German phone', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
    renderTerms();

    expect(screen.getByRole('heading', { name: '1. Anwendungsbereich' })).toBeInTheDocument();
    expect(screen.queryByText(/Scope/)).not.toBeInTheDocument();
  });

  it('switches language in place with the EN · DE switch', async () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    renderTerms();

    await userEvent.click(screen.getByRole('button', { name: 'DE' }));

    expect(screen.getByRole('heading', { name: '1. Anwendungsbereich' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '1. Scope' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'DE' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { name: 'Nutzungsbedingungen', level: 2 })).toBeInTheDocument();
  });
});

describe('PrivacyPolicy', () => {
  it('renders one language at a time', () => {
    const { rerender } = render(<PrivacyPolicy lang="en" />);
    expect(screen.getByRole('heading', { name: '7. Your Rights' })).toBeInTheDocument();
    expect(screen.queryByText(/Ihre Rechte/)).not.toBeInTheDocument();

    rerender(<PrivacyPolicy lang="de" />);
    expect(screen.getByRole('heading', { name: '7. Ihre Rechte' })).toBeInTheDocument();
    expect(screen.queryByText(/Your Rights/)).not.toBeInTheDocument();
  });
});
