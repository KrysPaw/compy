/** Public About dialog contact — set via NEXT_PUBLIC_* env (not i18n). */
export function getCreatorName(): string {
  return process.env.NEXT_PUBLIC_CREATOR_NAME?.trim() ?? '';
}

export function getContactEmail(): string {
  return process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() ?? '';
}
