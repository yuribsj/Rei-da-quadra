import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { SupportedLanguage, SUPPORTED_LANGUAGES } from '../lib/i18n';
import { useAuth } from './AuthContext';

const STORAGE_PREFIX = '@rei_da_quadra_lang_';

type LanguageContextValue = {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: 'pt',
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<SupportedLanguage>('pt');

  const storageKey = user ? `${STORAGE_PREFIX}${user.id}` : null;

  useEffect(() => {
    if (!storageKey) {
      setLanguageState('pt');
      i18n.changeLanguage('pt');
      return;
    }
    AsyncStorage.getItem(storageKey).then(val => {
      const lang = SUPPORTED_LANGUAGES.includes(val as SupportedLanguage)
        ? (val as SupportedLanguage)
        : 'pt';
      setLanguageState(lang);
      i18n.changeLanguage(lang);
    });
  }, [storageKey]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    if (storageKey) AsyncStorage.setItem(storageKey, lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
