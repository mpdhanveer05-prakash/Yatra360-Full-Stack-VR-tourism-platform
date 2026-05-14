// Lightweight i18n for guide-facing strings. Tied to uiStore.narrationLang.
// Maps BCP-47 (en-IN, hi-IN…) → Wikipedia 2-letter code + UI strings.

export type LangCode = 'en' | 'hi' | 'ta' | 'bn' | 'mr'

export interface GuideStrings {
  title:       string
  emptyPrompt: (place: string) => string
  inputHint:   string
  send:        string
  thinking:    string
  clear:       string
  langPicker:  string
  source:      string
}

const en: GuideStrings = {
  title:       'Virtual Guide',
  emptyPrompt: place => `Ask me anything about ${place}…`,
  inputHint:   'Ask about this place…',
  send:        'Send',
  thinking:    'Thinking…',
  clear:       'Clear conversation',
  langPicker:  'Language',
  source:      'Source',
}

const hi: GuideStrings = {
  title:       'आभासी मार्गदर्शक',
  emptyPrompt: place => `${place} के बारे में कुछ भी पूछें…`,
  inputHint:   'इस स्थान के बारे में पूछें…',
  send:        'भेजें',
  thinking:    'सोच रहा है…',
  clear:       'बातचीत मिटाएँ',
  langPicker:  'भाषा',
  source:      'स्रोत',
}

const ta: GuideStrings = {
  title:       'மெய்நிகர் வழிகாட்டி',
  emptyPrompt: place => `${place} பற்றி எதையும் கேளுங்கள்…`,
  inputHint:   'இந்த இடம் பற்றி கேளுங்கள்…',
  send:        'அனுப்பு',
  thinking:    'சிந்திக்கிறது…',
  clear:       'உரையாடலை அழி',
  langPicker:  'மொழி',
  source:      'மூலம்',
}

const bn: GuideStrings = {
  title:       'ভার্চুয়াল গাইড',
  emptyPrompt: place => `${place} সম্পর্কে যেকোনো প্রশ্ন করুন…`,
  inputHint:   'এই স্থান সম্পর্কে জিজ্ঞাসা করুন…',
  send:        'পাঠান',
  thinking:    'ভাবছে…',
  clear:       'কথোপকথন মুছুন',
  langPicker:  'ভাষা',
  source:      'উৎস',
}

const mr: GuideStrings = {
  title:       'आभासी मार्गदर्शक',
  emptyPrompt: place => `${place} बद्दल काहीही विचारा…`,
  inputHint:   'या ठिकाणाबद्दल विचारा…',
  send:        'पाठवा',
  thinking:    'विचार करत आहे…',
  clear:       'संभाषण मिटवा',
  langPicker:  'भाषा',
  source:      'स्रोत',
}

const TABLE: Record<LangCode, GuideStrings> = { en, hi, ta, bn, mr }

export function guideStrings(lang: LangCode): GuideStrings {
  return TABLE[lang] ?? en
}

/** Map BCP-47 (e.g. "hi-IN") → 2-letter wiki / RAG code. */
export function toLangCode(bcp47: string | undefined | null): LangCode {
  if (!bcp47) return 'en'
  const head = bcp47.slice(0, 2).toLowerCase()
  if (head === 'hi' || head === 'ta' || head === 'bn' || head === 'mr') return head
  return 'en'
}
