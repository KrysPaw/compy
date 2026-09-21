import type { ReactElement, ReactNode } from 'react';
import { render as renderTl, type RenderOptions } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { ComparisonViewModeProvider } from '@/hooks/use-comparison-view-mode';
import en from '../messages/en.json';

function IntlWrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={en}>
      {children}
    </NextIntlClientProvider>
  );
}

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return renderTl(ui, { wrapper: IntlWrapper, ...options });
}

export function renderWithViewMode(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return renderTl(ui, {
    wrapper: ({ children }) => (
      <IntlWrapper>
        <ComparisonViewModeProvider>{children}</ComparisonViewModeProvider>
      </IntlWrapper>
    ),
    ...options,
  });
}
