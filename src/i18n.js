import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGE_STORAGE_KEY = 'litloom_language';

function detectInitialLanguage() {
  if (typeof window !== 'undefined') {
    const stored = String(window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || '').trim().toLowerCase();
    if (stored === 'en' || stored === 'am') return stored;
  }

  if (typeof navigator !== 'undefined') {
    const browserLang = String(navigator.language || navigator.userLanguage || '').toLowerCase();
    if (browserLang.startsWith('am')) return 'am';
  }

  return 'en';
}

// the translations
// (tip: move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
  en: {
    translation: {
      "Home": "Home",
      "Blogs": "Blogs",
      "Articles": "Articles",
      "Podcasts": "Podcasts",
      "Books": "Books",
      "Artworks": "Artworks",
      "Poems": "Poems",
      "Paintings": "Paintings",
      "Photography": "Photography",
      "About": "About",
      "Contact": "Contact",
      "About Us": "About Us",
      "Contact Us": "Contact Us",
      "Privacy Policy": "Privacy Policy",
      "Artworks menu": "Artworks menu",
      "Others menu": "Others menu",
      "Search": "Search literature, voices, art...",
      "Subscribe": "Subscribe",
      "Language": "Language",
      "Language: English": "Language: English",
      "Language: Amharic": "Language: Amharic",
      "Lit·loom": "Lit·loom",
      "A quiet place for words, voices, and art": "A quiet place for words, voices, and art — woven slowly, read deeply.",
      "Start Reading": "Start Reading",
      "Listen": "Listen",
      "Featured Articles": "Featured Articles",
      "Recent Blogs": "Recent Blogs",
      "Recommended Books": "Recommended Books",
      "Join Our Community": "Join Our Community",
      "A quiet circle": "A quiet circle",
      "Once a week, we send a carefully written letter": "Once a week, we send a carefully written letter — essays, art, and ideas worth pausing for. No noise. No rush. Just meaning.",
      "Free forever • No spam • Unsubscribe anytime": "Free forever • No spam • Unsubscribe anytime",
      "Back to Podcasts": "← Back to Podcasts",
      "Comments": "Comments",
      "Your name": "Your name",
      "Write your comment...": "Write your comment...",
      "Send": "Send",
      "Podcast not found.": "Podcast not found.",
      "Search results": "Search results",
      "No results found": "No results found",
      // Add more as needed
    }
  },
  am: {
    translation: {
      "Home": "መነሻ",
      "Blogs": "ብሎጎች",
      "Articles": "መጣጥፎች",
      "Podcasts": "ፖድካስቶች",
      "Books": "መጽሔቶች",
      "Artworks": "ጥበባዊ ስራዎች",
      "Poems": "ግጥሞች",
      "Paintings": "ስዕሎች",
      "Photography": "ፎቶግራፊ",
      "About": "ስለ",
      "Contact": "አግኝ",
      "About Us": "ስለ እኛ",
      "Contact Us": "አግኙን",
      "Privacy Policy": "የግላዊነት ፖሊሲ",
      "Artworks menu": "የጥበብ ዝርዝር",
      "Others menu": "ሌሎች ዝርዝር",
      "Search": "የምክትል ምክትል፣ ድምጾች፣ ስነ-ጥበብ...",
      "Subscribe": "የዜና ምዝገባ",
      "Language": "ቋንቋ",
      "Language: English": "ቋንቋ: እንግሊዝኛ",
      "Language: Amharic": "ቋንቋ: አማርኛ",
      "Lit·loom": "ሊት·ሉም",
      "A quiet place for words, voices, and art": "ለቃላት፣ ድምጾች እና ስነ-ጥበብ ያልሆነ ቦታ — በዝግታ የሚለም፣ በጥሩ የሚነበብ።",
      "Start Reading": "መነሻ የሚነበብ",
      "Listen": "ስማ",
      "Featured Articles": "የተለዩ መጣጥፎች",
      "Recent Blogs": "ያለፈው ብሎጎች",
      "Recommended Books": "የሚመከሩ መጽሔቶች",
      "Join Our Community": "አባላት ይሁኑ",
      "A quiet circle": "ያልሆነ ክፍለ ከተማ",
      "Once a week, we send a carefully written letter": "በሳምንት አንድ ጊዜ በጥሩ የሚለም የዜና መልክ እንልክልዎታለን — መጣጥፎች፣ ስነ-ጥበብ እና ሀሳቦች ለማስቀረት ያልተለመዱ። ምንም ጫና የለም። ምንም ቅጣት የለም። ብቻ ትርጉህ።",
      "Free forever • No spam • Unsubscribe anytime": "ለዘላለም ነጻ • ምንም ስፓም የለም • በማንኛው ጊዜ ያለምዝገባ ይሁኑ",
      "Back to Podcasts": "← ወደ ፖድካስቶች ተመለስ",
      "Comments": "አስተያየቶች",
      "Your name": "ስምህ",
      "Write your comment...": "አስተያየትህን ጻፍ...",
      "Send": "ላክ",
      "Podcast not found.": "ፖድካስት አልተለመደም።",
      "Search results": "የፍለጋ ውጤቶች",
      "No results found": "ምንም ውጤት አልተገኘም",
      // Add more
    }
  }
};

i18n
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    resources,
    lng: detectInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'am'],
    // you can use the i18n.changeLanguage function to change the language manually: https://www.i18next.com/overview/api#changelanguage
    // if you're using a language detector, do not define the lng option

    interpolation: {
      escapeValue: false // react already does escaping
    }
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined') return;
  const normalized = String(lng || '').toLowerCase();
  if (normalized === 'en' || normalized === 'am') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, normalized);
  }
});

export default i18n;
