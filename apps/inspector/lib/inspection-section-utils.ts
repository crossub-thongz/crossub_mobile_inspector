export function normalizeSectionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function validateNewSectionName(
  name: string,
  activeSections: readonly string[],
): string | null {
  const normalized = normalizeSectionName(name);
  if (normalized.length < 2) {
    return 'Enter a section name (at least 2 characters).';
  }
  const key = normalized.toLowerCase();
  if (activeSections.some((section) => section.trim().toLowerCase() === key)) {
    return 'This section is already added.';
  }
  return null;
}
