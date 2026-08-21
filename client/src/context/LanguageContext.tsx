import React, { createContext, useContext, useCallback } from 'react';

export type Language = 'en';

interface Translations {
  [key: string]: {
    en: string;
  };
}

export const TRANSLATIONS: Translations = {
  'nav.dashboard': { en: 'Dashboard' },
  'nav.assessment': { en: 'AI Assessment' },
  'nav.analytics': { en: 'Analytics' },
  'nav.leaderboard': { en: 'Leaderboard' },
  'nav.passport': { en: 'Sports Passport' },
  'nav.recruiter': { en: 'Recruiter Hub' },
  'nav.signin': { en: 'Sign In' },
  'nav.register': { en: 'Register' },
  'nav.signout': { en: 'Sign Out' },
  'nav.startAssessment': { en: 'Start AI Assessment' },
  'common.search': { en: 'Search' },
  'common.filters': { en: 'Filters' },
  'common.clearAll': { en: 'Clear All' },
  'common.download': { en: 'Download' },
  'common.share': { en: 'Share' },
  'common.print': { en: 'Print' },
  'common.verified': { en: 'Verified' },
  'common.overall': { en: 'Overall' },
  'common.speed': { en: 'Speed' },
  'common.strength': { en: 'Strength' },
  'common.agility': { en: 'Agility' },
  'common.endurance': { en: 'Endurance' },
  'common.power': { en: 'Power' },
  'common.symmetry': { en: 'Symmetry' },
  'common.squats': { en: 'Squats' },
  'common.pushups': { en: 'Push-ups' },
  'common.curls': { en: 'Dumbbell Curls' },
  'common.sprint': { en: 'Sprint' },
  'common.pts': { en: 'PTS' },
  'common.rank': { en: 'Rank' },
  'common.state': { en: 'State' },
  'common.sport': { en: 'Sport' },
  'common.age': { en: 'Age' },
  'common.category': { en: 'Category' },
  'common.close': { en: 'Close' },
  'common.save': { en: 'Save' },
  'common.contact': { en: 'Contact' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const language: Language = 'en';

  const setLanguage = useCallback((_lang: Language) => {}, []);
  const toggleLanguage = useCallback(() => {}, []);

  const t = useCallback(
    (key: string, defaultText?: string): string => {
      const item = TRANSLATIONS[key];
      if (item && item.en) {
        return item.en;
      }
      return defaultText || item?.en || key;
    },
    []
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
