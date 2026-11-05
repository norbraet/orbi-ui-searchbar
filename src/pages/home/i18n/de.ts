const home = {
  title: 'Suchleisten-Komponente',
  description: 'Eine Vue-Suchkomponente mit Beispieldaten.',
  searchDemo: {
    open: 'Arbeitsbereich durchsuchen',
    hint: 'Probiere „decision“, „design“, „tokens“ oder „canary“.',
    catalog: '{count} Beispielinhalte · {scopes} Bereiche',
    scenario: 'Szenario',
    default: 'Ergebnisse und Vorschläge',
    empty: 'Keine Ergebnisse',
    error: 'Dienst nicht verfügbar',
    slow: 'Langsame Antwort',
    noPreview: 'Fehlende Vorschau',
    scopes: {
      documents: 'Dokumente',
      decisions: 'Entscheidungen',
      links: 'Links',
      issues: 'Tickets',
      notes: 'Notizen',
      'design-files': 'Designdateien',
    },
  },
  meta: { title: 'Suchleisten-Komponente · Orbi Search' },
} as const

export default home
