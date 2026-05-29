// ══════════════════════════════════════════════
// localStorage helpers
// ══════════════════════════════════════════════
export const LS = {
  get: (key, fallback) => {
    try {
      const v = localStorage.getItem(key)
      return v != null ? JSON.parse(v) : fallback
    } catch {
      return fallback
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key)
    } catch {}
  },
  keys: () => {
    try {
      return Object.keys(localStorage)
    } catch {
      return []
    }
  },
}

// ══════════════════════════════════════════════
// All storage keys in one place
// ══════════════════════════════════════════════
export const KEYS = {
  NOW:          'ci-now',
  JUST:         'ci-just',
  WOULD:        'ci-would',
  SESSIONS:     'ci-sessions',
  TODAY:        'today-entries',
  INSP:         'insp-entries',
  IDEAS:        'ideas-entries',
  PLAN:         'plan-entries',
  NOTES:        'notes-v4',
  NOTES_OLD:    'notes-v3',
  FOLDERS:      'note-folders',
  DREAMS:       'dreams',
  DREAM_CATS:   'dreams-cats',
  MEDITATIONS:  'meditations',
  THEME:        'ci-theme',
  FONT_SIZE:    'ci-fontSize',
  CUSTOM_A:     'ci-custom-a',
  CUSTOM_B:     'ci-custom-b',
  CHIME:        'chime',
  MED_DUR:      'med-dur',
  MED_SND:      'med-snd',
  HIGHLIGHTS:   'highlights-entries',
  PHYSICAL:     'physical-entries',
  ACTIVITY:     'activity-log',
}
