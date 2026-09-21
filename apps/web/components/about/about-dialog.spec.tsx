import { screen } from '@testing-library/react';
import { render } from '@/test/render';
import { describe, expect, it, vi } from 'vitest';
import { appVersion } from '@/lib/about/app-version';
import { AboutDialog } from './about-dialog';

describe('AboutDialog', () => {
  it('shows creator, contact, version, and changelog', () => {
    render(
      <AboutDialog open onOpenChange={vi.fn()} />,
    );

    expect(
      screen.getByRole('heading', { name: 'About Compy' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Flexible comparison of products and services that are similar in terms of preference.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Krystian Pawełczak')).toBeInTheDocument();

    const mail = screen.getByRole('link', { name: 'kryspaw0@gmail.com' });
    expect(mail).toHaveAttribute('href', 'mailto:kryspaw0@gmail.com');

    expect(screen.getByText(appVersion)).toBeInTheDocument();
    expect(screen.getByText('Changelog')).toBeInTheDocument();
    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
    expect(
      screen.getByText('Initial public release of Compy.'),
    ).toBeInTheDocument();
  });
});
