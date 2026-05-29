// ══════════════════════════════════════════════
// QUOTES
// ══════════════════════════════════════════════
export const QUOTES = [
  "Notice what is good right now",
  "Find one thing to appreciate",
  "Your attention shapes your experience",
  "What you focus on grows",
  "Every moment holds something good",
  "Pause and breathe it in",
  "Joy lives in small moments",
  "You are enough, right now",
  "This moment is enough",
  "Gratitude opens every door",
  "Your thoughts create your feelings",
  "Choose the thought that feels better",
  "Small joys matter most",
  "Savour what is already yours",
  "You deserve kindness, especially from yourself",
  "Begin right where you are",
]

export const getRandomQuote = () => QUOTES[Math.floor(Math.random() * QUOTES.length)]

// ══════════════════════════════════════════════
// COLOUR THEMES
// Each theme has its own vivid button colours
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
// COLOUR THEMES
// Four presets — all editable and saveable
// ══════════════════════════════════════════════
export const THEMES = {
  'vivid': {
    name: 'Vivid',
    emoji: '✦',
    colours: ['#EAF0FA', '#2255CC', '#E0507A', '#0AABBB', '#E0941A'],
    vars: {
      '--bg-a': '#EAF0FA', '--bg-b': '#D8E4F8',
      '--text-hi': '#0A1A4A', '--text-lo': '#4A60AA',
      '--accent': '#2255CC', '--accent-soft': 'rgba(34,85,204,0.1)',
      '--now': '#2255CC', '--now-dk': '#1A3A99',
      '--morning': '#5080D8', '--morning-dk': '#2255CC',
      '--afternoon': '#7AAAE0', '--afternoon-dk': '#4A78C0',
      '--evening': '#1A3A99', '--evening-dk': '#0A2070',
      '--btn-enjoy': '#2255CC', '--btn-enjoy-dk': '#1A3A99',
      '--btn-plan': '#E0507A', '--btn-plan-dk': '#B83060',
      '--btn-achieve': '#0AABBB', '--btn-achieve-dk': '#007A88',
      '--btn-highlights': '#E0941A', '--btn-highlights-dk': '#B06800',
      '--btn-physical': '#C06040', '--btn-physical-dk': '#904020',
      '--border': 'rgba(34,85,204,0.12)',
    },
  },
  'coastal': {
    name: 'Coastal',
    emoji: '🌅',
    colours: ['#FFF8F0', '#E8703A', '#3AA8D8', '#52B870', '#F0C030'],
    vars: {
      '--bg-a': '#FFF8F0', '--bg-b': '#FCEEE0',
      '--text-hi': '#2A1A0A', '--text-lo': '#8A6A4A',
      '--accent': '#E8703A', '--accent-soft': 'rgba(232,112,58,0.1)',
      '--now': '#E8703A', '--now-dk': '#C04A18',
      '--morning': '#F0A060', '--morning-dk': '#E8703A',
      '--afternoon': '#FAC880', '--afternoon-dk': '#E8A030',
      '--evening': '#C04A18', '--evening-dk': '#902808',
      '--btn-enjoy': '#E8703A', '--btn-enjoy-dk': '#C04A18',
      '--btn-plan': '#3AA8D8', '--btn-plan-dk': '#1A78A8',
      '--btn-achieve': '#52B870', '--btn-achieve-dk': '#2A8840',
      '--btn-highlights': '#F0C030', '--btn-highlights-dk': '#C09000',
      '--btn-physical': '#C06040', '--btn-physical-dk': '#904020',
      '--border': 'rgba(232,112,58,0.12)',
    },
  },
  'cyan-teal': {
    name: 'Cyan & Teal',
    emoji: '🩵',
    colours: ['#EEF3FC', '#6B96D6', '#3D82E0', '#E07830', '#0AABBB'],
    vars: {
      '--bg-a': '#EEF3FC', '--bg-b': '#D8E6F8',
      '--text-hi': '#1A3570', '--text-lo': '#4A6AAA',
      '--accent': '#6B96D6', '--accent-soft': 'rgba(107,150,214,0.1)',
      '--now': '#6B96D6', '--now-dk': '#2952A3',
      '--morning': '#7AAAE0', '--morning-dk': '#3D6FBB',
      '--afternoon': '#A0C0E8', '--afternoon-dk': '#6B96D6',
      '--evening': '#4A78C0', '--evening-dk': '#2952A3',
      '--btn-enjoy': '#3D82E0', '--btn-enjoy-dk': '#1A5DB8',
      '--btn-plan': '#E07830', '--btn-plan-dk': '#B05010',
      '--btn-achieve': '#0AABBB', '--btn-achieve-dk': '#007A88',
      '--btn-highlights': '#C060A8', '--btn-highlights-dk': '#8A2070',
      '--btn-physical': '#C06040', '--btn-physical-dk': '#904020',
      '--border': 'rgba(107,150,214,0.12)',
    },
  },
  'purple-lilac': {
    name: 'Purple & Lilac',
    emoji: '💜',
    colours: ['#F6F2FC', '#9898E0', '#7060D8', '#E06080', '#30A8B0'],
    vars: {
      '--bg-a': '#F6F2FC', '--bg-b': '#EDE6F8',
      '--text-hi': '#3D2070', '--text-lo': '#8070B0',
      '--accent': '#9898E0', '--accent-soft': 'rgba(152,152,224,0.1)',
      '--now': '#9898E0', '--now-dk': '#7270DD',
      '--morning': '#C4B0F0', '--morning-dk': '#9A70C0',
      '--afternoon': '#B8A8E8', '--afternoon-dk': '#9898E0',
      '--evening': '#DE83CB', '--evening-dk': '#B82878',
      '--btn-enjoy': '#7060D8', '--btn-enjoy-dk': '#5040B0',
      '--btn-plan': '#E06080', '--btn-plan-dk': '#B03060',
      '--btn-achieve': '#30A8B0', '--btn-achieve-dk': '#207880',
      '--btn-highlights': '#C040C0', '--btn-highlights-dk': '#902090',
      '--btn-physical': '#C06040', '--btn-physical-dk': '#904020',
      '--border': 'rgba(152,152,224,0.12)',
    },
  },
}

// Keys for per-theme overrides stored in localStorage
export const THEME_OVERRIDE_KEY = (key) => `ci-theme-override-${key}`

// ══════════════════════════════════════════════
// 48-COLOUR PALETTE (for custom theme picker)
// ══════════════════════════════════════════════
export const PALETTE_48 = [
  '#E8604A', '#E09898', '#FDB4A6',
  '#6B4923', '#C86000', '#A07858', '#FF8701', '#D8A860', '#C6A28A', '#F5C096',
  '#FFD850', '#F0F094', '#909820', '#AAB808',
  '#AEBF61', '#87A230', '#C4E66A', '#4A7000',
  '#BEE1B9', '#76C474', '#1D9642',
  '#009A82', '#A6E4DD', '#70C0B8',
  '#107070', '#A2E2EB', '#00A8C0', '#4A8898', '#306878', '#71B3E7',
  '#2297FA', '#0070D8', '#A2C6E8', '#1A5092',
  '#9898E0', '#7270DD', '#3A28A0', '#524094', '#9A70C0', '#512475',
  '#DE83CB', '#B82878', '#A00058', '#FEB2D9', '#DC4A93', '#FA86B2', '#C84878', '#E1255B',
]

export const BACKGROUND_PALETTE = [
  { hex: '#FAF8F4', name: 'Warm Cream' },
  { hex: '#FAF4EE', name: 'Soft Peach' },
  { hex: '#FDF8EC', name: 'Pale Gold' },
  { hex: '#F6FAF0', name: 'Pale Sage' },
  { hex: '#EDF8F8', name: 'Aqua Mist' },
  { hex: '#EEF2FC', name: 'Ice Blue' },
  { hex: '#F4F0F8', name: 'Pale Lavender' },
  { hex: '#FCF0F6', name: 'Blush' },
  { hex: '#F8F8F8', name: 'Pure White' },
  { hex: '#F0EDE6', name: 'Linen' },
]

export const NOTE_BG_COLORS = [
  '#FFFEF9', '#FFF8E1', '#FFF3E0', '#FCE4EC', '#F3E5F5', '#E8EAF6',
  '#E3F2FD', '#E0F2F1', '#F1F8E9', '#FFF9C4', '#F9FBE7', '#E8F5E9',
  '#FFFFFF', '#F5F5F5', '#EFEBE9', '#FBE9E7',
]

export const NOTE_TEXT_COLORS = [
  '#1a1a1a', '#2a2018', '#1A3570', '#3D2070', '#1B5E20', '#01579B',
  '#4A148C', '#880E4F', '#BF360C', '#E65100', '#33691E', '#006064',
]

export const DEFAULT_DREAM_CATS = [
  'Travel', 'Career', 'Health', 'Family', 'Home', 'Learning', 'Creative',
]

export const FONT_SIZES = [
  { key: 'small',   label: 'Small',   px: '19px', scale: '1'    },
  { key: 'default', label: 'Medium',  px: '21px', scale: '1.1'  },
  { key: 'large',   label: 'Large',   px: '23px', scale: '1.21' },
]
