import type { SearchPaletteLabels } from '@/features/search-palette/types'

export const searchPaletteLabelsDe: SearchPaletteLabels = {
  title: 'Arbeitsbereich durchsuchen',
  search: 'Suche',
  placeholder: 'Dokumente, Links und Entscheidungen suchen…',
  close: 'Suche schließen',
  results: 'Suchergebnisse',
  suggestions: 'Suchvorschläge',
  scopes: 'Suchbereich',
  allScopes: 'Alle Inhalte',
  clearScope: 'Alle Inhalte durchsuchen',
  loading: 'Suche läuft…',
  empty: 'Keine Ergebnisse. Versuche einen anderen oder allgemeineren Suchbegriff.',
  error: 'Die Suche ist nicht verfügbar. Bitte versuche es erneut.',
  retry: 'Erneut versuchen',
  preview: 'Vorschau',
  noPreview: 'Keine Vorschau verfügbar. Öffne das Ergebnis, um mehr zu erfahren.',
  openResult: 'Ergebnis öffnen',
  navigationHint: '↑ ↓ navigieren · Enter öffnen · Esc schließen',
  updated: 'Aktualisiert',
  resultCount: (count) => `${count} ${count === 1 ? 'Ergebnis' : 'Ergebnisse'}`,
}
