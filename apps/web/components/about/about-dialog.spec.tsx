import { screen } from '@testing-library/react';
import { render } from '@/test/render';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { appVersion } from '@/lib/about/app-version';
import { AboutDialog } from './about-dialog';

const FAKE_CREATOR = 'Ada Example';
const FAKE_EMAIL = 'contact@example.com';

describe('AboutDialog', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('shows creator, contact, version, and changelog', () => {
    vi.stubEnv('NEXT_PUBLIC_CREATOR_NAME', FAKE_CREATOR);
    vi.stubEnv('NEXT_PUBLIC_CONTACT_EMAIL', FAKE_EMAIL);

    render(<AboutDialog open onOpenChange={vi.fn()} />);

    expect(
      screen.getByRole('heading', { name: 'About Compy' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Flexible comparison of products and services that are similar in terms of preference.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(FAKE_CREATOR)).toBeInTheDocument();

    const mail = screen.getByRole('link', { name: FAKE_EMAIL });
    expect(mail).toHaveAttribute('href', `mailto:${FAKE_EMAIL}`);

    expect(screen.getByText(appVersion)).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('First stable release.')).toBeInTheDocument();
  });
});
