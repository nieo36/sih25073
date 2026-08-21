import React, { createContext, useContext, useState, useCallback } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', hi: 'डैशबोर्ड' },
  'nav.assessment': { en: 'AI Assessment', hi: 'एआई मूल्यांकन' },
  'nav.analytics': { en: 'Analytics', hi: 'एनालिटिक्स' },
  'nav.leaderboard': { en: 'Leaderboard', hi: 'लीडरबोर्ड' },
  'nav.passport': { en: 'Sports Passport', hi: 'स्पोर्ट्स पासपोर्ट' },
  'nav.recruiter': { en: 'Recruiter Hub', hi: 'रिक्रूटर हब' },
  'nav.signin': { en: 'Sign In', hi: 'साइन इन' },
  'nav.register': { en: 'Register', hi: 'रजिस्टर' },
  'nav.signout': { en: 'Sign Out', hi: 'लॉग आउट' },
  'nav.startAssessment': { en: 'Start AI Assessment', hi: 'एआई मूल्यांकन शुरू करें' },

  // Common UI
  'common.search': { en: 'Search', hi: 'खोजें' },
  'common.filters': { en: 'Filters', hi: 'फ़िल्टर' },
  'common.clearAll': { en: 'Clear All', hi: 'सभी हटाएं' },
  'common.download': { en: 'Download', hi: 'डाउनलोड' },
  'common.share': { en: 'Share', hi: 'साझा करें' },
  'common.print': { en: 'Print', hi: 'प्रिंट' },
  'common.verified': { en: 'Verified', hi: 'सत्यापित' },
  'common.cryptographic': { en: 'Cryptographically Signed', hi: 'क्रिप्टोग्राफ़िक रूप से हस्ताक्षरित' },
  'common.liveVerified': { en: 'Live Verified', hi: 'लाइव सत्यापित' },
  'common.overall': { en: 'Overall', hi: 'समग्र' },
  'common.speed': { en: 'Speed', hi: 'गति' },
  'common.strength': { en: 'Strength', hi: 'शक्ति' },
  'common.agility': { en: 'Agility', hi: 'चपलता' },
  'common.endurance': { en: 'Endurance', hi: 'सहनशक्ति' },
  'common.power': { en: 'Power', hi: 'पावर' },
  'common.symmetry': { en: 'Symmetry', hi: 'समरूपता' },
  'common.squats': { en: 'Squats', hi: 'स्क्वैट्स' },
  'common.pushups': { en: 'Push-ups', hi: 'पुश-अप्स' },
  'common.sprint': { en: 'Sprint', hi: 'स्प्रिंट' },
  'common.pts': { en: 'PTS', hi: 'अंक' },
  'common.rank': { en: 'Rank', hi: 'रैंक' },
  'common.state': { en: 'State', hi: 'राज्य' },
  'common.sport': { en: 'Sport', hi: 'खेल' },
  'common.age': { en: 'Age', hi: 'आयु' },
  'common.category': { en: 'Category', hi: 'श्रेणी' },
  'common.close': { en: 'Close', hi: 'बंद करें' },
  'common.save': { en: 'Save', hi: 'सहेजें' },
  'common.contact': { en: 'Contact', hi: 'संपर्क करें' },

  // Leaderboard
  'lb.portal': { en: 'National Talent Identification Portal', hi: 'राष्ट्रीय प्रतिभा पहचान पोर्टल' },
  'lb.title1': { en: 'All-India', hi: 'अखिल भारतीय' },
  'lb.title2': { en: 'Leaderboard', hi: 'लीडरबोर्ड' },
  'lb.subtitle': {
    en: 'Rankings verified via computer vision biomechanical analysis for SAI talent scouts.',
    hi: 'साई (SAI) प्रतिभा स्काउट्स के लिए कंप्यूटर विज़न बायोमैकेनिकल विश्लेषण द्वारा सत्यापित रैंकिंग।',
  },
  'lb.nationalLeader': { en: 'National Leader', hi: 'राष्ट्रीय लीडर' },
  'lb.benchmarkLeader': { en: 'Benchmark Leader', hi: 'बेंचमार्क लीडर' },
  'lb.yourPosition': { en: 'Your Position', hi: 'आपकी स्थिति' },
  'lb.nationally': { en: 'Nationally', hi: 'राष्ट्रीय स्तर पर' },
  'lb.rankingMetric': { en: 'Ranking Metric', hi: 'रैंकिंग मीट्रिक' },
  'lb.standings': { en: 'National Standings', hi: 'राष्ट्रीय स्टैंडिंग' },
  'lb.loadMore': { en: 'Load More Athletes', hi: 'और एथलीट लोड करें' },
  'lb.yourRankings': { en: 'Your Rankings', hi: 'आपकी रैंकिंग्स' },
  'lb.methodology': { en: 'Ranking Methodology', hi: 'रैंकिंग कार्यप्रणाली' },

  // Passport
  'pass.portal': { en: 'National Sports Repository Verified', hi: 'राष्ट्रीय खेल भंडार द्वारा सत्यापित' },
  'pass.title1': { en: 'Digital Athlete', hi: 'डिजिटल एथलीट' },
  'pass.title2': { en: 'Sports Passport', hi: 'स्पोर्ट्स पासपोर्ट' },
  'pass.subtitle': {
    en: 'Government & Sports Authority of India (SAI) recognized cryptographic proof of physical benchmarks.',
    hi: 'शारीरिक बेंचमार्क का भारत सरकार एवं भारतीय खेल प्राधिकरण (SAI) द्वारा मान्यता प्राप्त प्रमाण।',
  },
  'pass.downloadCert': { en: 'Download Certificate', hi: 'प्रमाणपत्र डाउनलोड करें' },
  'pass.generatingPdf': { en: 'Generating PDF...', hi: 'पीडीएफ बनाई जा रही है...' },
  'pass.scanToVerify': { en: 'SCAN TO VERIFY ON-FIELD', hi: 'मैदान पर सत्यापित करने हेतु स्कैन करें' },
  'pass.radar': { en: 'Verified Biomechanical Competency Radar', hi: 'सत्यापित बायोमैकेनिकल दक्षता रडार' },
  'pass.lowerPower': { en: 'Lower Power', hi: 'निचली शक्ति (लोअर पावर)' },
  'pass.upperPower': { en: 'Upper Power', hi: 'ऊपरी शक्ति (अपर पावर)' },
  'pass.mobility': { en: 'Mobility & ROM', hi: 'गतिशीलता और आरओएम' },
  'pass.bilateral': { en: 'Bilateral Symmetry', hi: 'द्विपक्षीय समरूपता' },
  'pass.overallGrade': { en: 'Overall Grade', hi: 'समग्र ग्रेड' },
  'pass.assessments': { en: 'Verified Performance Assessments', hi: 'सत्यापित प्रदर्शन मूल्यांकन' },

  // Recruiter Hub
  'rec.title1': { en: 'NATIONAL RECRUITER', hi: 'राष्ट्रीय रिक्रूटर' },
  'rec.title2': { en: '& SCOUTING HUB', hi: '& स्काउटिंग हब' },
  'rec.leadScout': { en: 'SAI Talent Scouts · Lead Scout', hi: 'साई प्रतिभा स्काउट्स · लीड स्काउट' },
  'rec.aiSearch': { en: 'AI Talent Search', hi: 'एआई प्रतिभा खोज' },
  'rec.aiSearchPlaceholder': {
    en: "e.g., 'Find U-18 football athletes in Uttar Pradesh with high sprint speed, agility above 85...'",
    hi: "उदा. 'उत्तर प्रदेश में उच्च स्प्रिंट गति और 85 से अधिक चपलता वाले अंडर-18 फुटबॉल एथलीट खोजें...'",
  },
  'rec.exportReport': { en: 'Export Scouting Report', hi: 'स्काउटिंग रिपोर्ट निर्यात करें' },
  'rec.shortlist': { en: 'My Shortlist', hi: 'मेरी शॉर्टलिस्ट' },
  'rec.athletes': { en: 'Athletes', hi: 'एथलीट' },
  'rec.match': { en: 'Match', hi: 'मैच' },
  'rec.viewPassport': { en: 'View Passport', hi: 'पासपोर्ट देखें' },
  'rec.contactAthlete': { en: 'Contact Athlete', hi: 'एथलीट से संपर्क करें' },
  'rec.insightsTitle': { en: 'National Talent Insights', hi: 'राष्ट्रीय प्रतिभा अंतर्दृष्टि' },
  'rec.topState': { en: 'Top State by Talent Volume', hi: 'प्रतिभा संख्या में शीर्ष राज्य' },
  'rec.privacyNotice': {
    en: 'Only verified recruiters can access direct contact information. Your current status is: Verified.',
    hi: 'केवल सत्यापित रिक्रूटर ही सीधे संपर्क विवरण देख सकते हैं। आपकी वर्तमान स्थिति: सत्यापित।',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, defaultText?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'kreedai_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem(LANGUAGE_KEY);
      if (stored === 'hi' || stored === 'en') return stored;
      return 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {}
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => {
      const next: Language = prev === 'en' ? 'hi' : 'en';
      try {
        localStorage.setItem(LANGUAGE_KEY, next);
      } catch {}
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string, defaultText?: string): string => {
      const item = TRANSLATIONS[key];
      if (item && item[language]) {
        return item[language];
      }
      return defaultText || item?.en || key;
    },
    [language]
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
