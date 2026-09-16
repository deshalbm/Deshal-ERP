const ALSHAMIL_LANG_STORAGE_KEY = "alshamil_lang";

export function getSavedWebsiteLanguage(): 'ar' | 'en' {
  if (typeof localStorage === 'undefined') return 'ar';
  try {
    const saved = localStorage.getItem(ALSHAMIL_LANG_STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

export function saveWebsiteLanguage(lang: 'ar' | 'en'): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(ALSHAMIL_LANG_STORAGE_KEY, lang);
  } catch {
    // ignore storage quota errors
  }
}
