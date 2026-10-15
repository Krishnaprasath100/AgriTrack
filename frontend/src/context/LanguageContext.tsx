'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'en' | 'ta';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);
const STORAGE_KEY = 'agritrack_language';

// Exact UI labels only. User-created crop, farm, person, and account names are
// intentionally not translated or modified.
const tamil: Record<string, string> = {
  'Ledger': 'கணக்குப் புத்தகம்',
  'New Entry': 'புதிய பதிவு',
  'Plantings': 'நடவுகள்',
  'Expense Types': 'செலவு வகைகள்',
  'Payees': 'பணம் பெறுபவர்கள்',
  'Accounts': 'கணக்குகள்',
  'Persons': 'நபர்கள்',
  'Reports': 'அறிக்கைகள்',
  'Dashboard': 'முகப்புப் பலகை',
  'Profile': 'சுயவிவரம்',
  'History': 'வரலாறு',
  'Income': 'வரவு',
  'Expenses': 'செலவுகள்',
  'Profit': 'லாபம்',
  'Administration': 'நிர்வாகம்',
  'Admin Console': 'நிர்வாகக் கட்டுப்பாடு',
  'Log Out': 'வெளியேறு',
  'Add Planting': 'நடவு சேர்க்கவும்',
  'Edit Planting': 'நடவைத் திருத்தவும்',
  'Add Account': 'கணக்கு சேர்க்கவும்',
  'Account details': 'கணக்கு விவரங்கள்',
  'Your accounts': 'உங்கள் கணக்குகள்',
  'Account display name *': 'கணக்கின் காட்சிப் பெயர் *',
  'Bank name': 'வங்கி பெயர்',
  'Account number': 'கணக்கு எண்',
  'IFSC code': 'IFSC குறியீடு',
  'Branch': 'கிளை',
  'Account type': 'கணக்கு வகை',
  'Use this as default account': 'இதை இயல்புநிலை கணக்காகப் பயன்படுத்தவும்',
  'Add Another Account': 'மற்றொரு கணக்கு சேர்க்கவும்',
  'Save Account': 'கணக்கைச் சேமிக்கவும்',
  'New Expense Entry': 'புதிய செலவுப் பதிவு',
  'New Income Entry': 'புதிய வரவுப் பதிவு',
  'Expense': 'செலவு',
  'Date': 'தேதி',
  'Crop / planting': 'பயிர் / நடவு',
  'Expense type': 'செலவு வகை',
  'Pesticide Purchase': 'பூச்சிக்கொல்லி கொள்முதல்',
  'Weeding': 'களை எடுத்தல்',
  'Fertilizer Purchase': 'உர கொள்முதல்',
  'Labour Wages': 'தொழிலாளர் கூலி',
  'Irrigation': 'நீர்ப்பாசனம்',
  'Harvesting': 'அறுவடை',
  'Seed Purchase': 'விதை கொள்முதல்',
  'Tractor Hire': 'டிராக்டர் வாடகை',
  'Land Preparation': 'நிலத் தயாரிப்பு',
  'Transport Charges': 'போக்குவரத்து கட்டணம்',
  'Electricity': 'மின்சாரம்',
  'Equipment Repair': 'உபகரணப் பழுதுபார்ப்பு',
  'Seeds': 'விதைகள்',
  'Fertilizers': 'உரங்கள்',
  'Pesticides': 'பூச்சிக்கொல்லிகள்',
  'Labour': 'தொழிலாளர்',
  'Equipment': 'உபகரணங்கள்',
  'Machinery rental': 'இயந்திர வாடகை',
  'Transportation': 'போக்குவரத்து',
  'Land preparation': 'நிலத் தயாரிப்பு',
  'Other': 'மற்றவை',
  'Payee': 'பணம் பெறுபவர்',
  'Received from': 'பெறப்பட்டவர்',
  'Paid from account': 'செலுத்திய கணக்கு',
  'Received into account': 'பெறப்பட்ட கணக்கு',
  'Amount (₹)': 'தொகை (₹)',
  'Notes': 'குறிப்புகள்',
  'Save Expense': 'செலவைச் சேமிக்கவும்',
  'Save Income': 'வரவைச் சேமிக்கவும்',
  'Cancel': 'ரத்துசெய்',
  'Save Entry': 'பதிவைச் சேமிக்கவும்',
  'Add crop': 'பயிர் சேர்க்கவும்',
  'Add type': 'வகை சேர்க்கவும்',
  'Add payee': 'பெறுபவரைச் சேர்க்கவும்',
  'Add person': 'நபரைச் சேர்க்கவும்',
  'Add account': 'கணக்கு சேர்க்கவும்',
  'Quick crop choices': 'விரைவு பயிர் தேர்வுகள்',
  'Expense types': 'செலவு வகைகள்',
  'Choose a payee (optional)': 'பெறுபவரைத் தேர்ந்தெடுக்கவும் (விருப்பம்)',
  'Choose a person (optional)': 'நபரைத் தேர்ந்தெடுக்கவும் (விருப்பம்)',
  'Choose a crop': 'ஒரு பயிரைத் தேர்ந்தெடுக்கவும்',
  'Choose an expense type': 'ஒரு செலவு வகையைத் தேர்ந்தெடுக்கவும்',
  'Choose an account': 'ஒரு கணக்கைத் தேர்ந்தெடுக்கவும்',
  'All crops': 'அனைத்து பயிர்கள்',
  'No ledger entries match this filter.': 'இந்த வடிப்பானுடன் பொருந்தும் கணக்குப் பதிவுகள் இல்லை.',
  'CROP': 'பயிர்',
  'DETAILS': 'விவரங்கள்',
  'PERSON / BUSINESS': 'நபர் / நிறுவனம்',
  'ACCOUNT': 'கணக்கு',
  'Sort by:': 'வரிசைப்படுத்து:',
  'Seeding Date': 'விதைப்பு தேதி',
  'Expected Harvest': 'எதிர்பார்க்கப்படும் அறுவடை',
  'Paddy (Rice)': 'நெல் (அரிசி)',
  'Wheat': 'கோதுமை',
  'Maize': 'மக்காச்சோளம்',
  'Cotton': 'பருத்தி',
  'Sugarcane': 'கரும்பு',
  'Banana': 'வாழைப்பழம்',
  'Tomato': 'தக்காளி',
  'Onion': 'வெங்காயம்',
  'Potato': 'உருளைக்கிழங்கு',
  'Chilli': 'மிளகாய்',
  'Groundnut': 'நிலக்கடலை',
  'Soybean': 'சோயாபீன்',
  'Millet': 'சிறுதானியம்',
  'Turmeric': 'மஞ்சள்',
  'Coconut': 'தேங்காய்',
  'Add Expense Type': 'செலவு வகை சேர்க்கவும்',
  'Create a category for your farming expenses.': 'உங்கள் விவசாய செலவுகளுக்கான வகையை உருவாக்கவும்.',
  'Expense type details': 'செலவு வகை விவரங்கள்',
  'Expense type name *': 'செலவு வகை பெயர் *',
  'Enter expense type name': 'செலவு வகை பெயரை உள்ளிடவும்',
  'Quick examples': 'விரைவு உதாரணங்கள்',
  'Select an option to fill the name.': 'பெயரை நிரப்ப ஒரு தேர்வைத் தேர்ந்தெடுக்கவும்.',
  'Saved expense types': 'சேமிக்கப்பட்ட செலவு வகைகள்',
  'Saved types will appear in the New Entry expense dropdown.': 'சேமித்த வகைகள் புதிய பதிவின் செலவு பட்டியலில் தோன்றும்.',
  'Save Type': 'வகையைச் சேமிக்கவும்',
  'Add Payee': 'பணம் பெறுபவரைச் சேர்க்கவும்',
  'Add the person or business you pay.': 'நீங்கள் பணம் செலுத்தும் நபர் அல்லது நிறுவனத்தைச் சேர்க்கவும்.',
  'Payee details': 'பெறுபவர் விவரங்கள்',
  'Payee name *': 'பெறுபவர் பெயர் *',
  'Enter payee name': 'பெறுபவர் பெயரை உள்ளிடவும்',
  'Mobile number': 'கைபேசி எண்',
  'Email': 'மின்னஞ்சல்',
  'Address': 'முகவரி',
  'Enter mobile number': 'கைபேசி எண்ணை உள்ளிடவும்',
  'Enter email address': 'மின்னஞ்சல் முகவரியை உள்ளிடவும்',
  'Enter address': 'முகவரியை உள்ளிடவும்',
  'Save Payee': 'பெறுபவரைச் சேமிக்கவும்',
  'Saved payees will appear in the New Entry form.': 'சேமித்த பெறுபவர்கள் புதிய பதிவு படிவத்தில் தோன்றுவார்கள்.',
  'Add Person': 'நபரைச் சேர்க்கவும்',
  'Person details': 'நபர் விவரங்கள்',
  'Person name *': 'நபர் பெயர் *',
  'Enter person name': 'நபர் பெயரை உள்ளிடவும்',
  'Save Person': 'நபரைச் சேமிக்கவும்',
  'Agricultural Reports & CSV Export': 'விவசாய அறிக்கைகள் மற்றும் CSV ஏற்றுமதி',
  'Expenses Ledger': 'செலவுக் கணக்குப் புத்தகம்',
  'Crop Sales Ledger': 'பயிர் விற்பனைக் கணக்குப் புத்தகம்',
  'Crop Lifecycle Ledger': 'பயிர் சுழற்சிக் கணக்குப் புத்தகம்',
  'P&L Profit Analysis': 'லாபம் மற்றும் நட்டப் பகுப்பாய்வு',
  'Download CSV': 'CSV பதிவிறக்கவும்',
  'Consolidated Profit & Loss Summary': 'ஒருங்கிணைந்த லாப நட்டச் சுருக்கம்',
  'Crop Variety': 'பயிர் வகை',
  'Field / Acreage': 'வயல் / பரப்பு',
  'Status': 'நிலை',
  'Total Revenue': 'மொத்த வருவாய்',
  'Total Costs': 'மொத்த செலவுகள்',
  'Net Profit': 'நிகர லாபம்',
  'Margin': 'விளிம்பு',
  'All Categories': 'அனைத்து வகைகள்',
  'All Crop Cycles': 'அனைத்து பயிர் சுழற்சிகள்',
  'All Statuses': 'அனைத்து நிலைகள்',
  'Search': 'தேடல்',
  'Clear Filters': 'வடிப்பான்களை நீக்கவும்',
  'From:': 'தொடக்கம்:',
  'To:': 'முடிவு:',
  'Total Income': 'மொத்த வரவு',
  'Total Expenses': 'மொத்த செலவுகள்',
  'Balance': 'இருப்பு',
  'Record Expense': 'செலவைப் பதிவு செய்யவும்',
  'Record Crop Sale': 'பயிர் விற்பனையைப் பதிவு செய்யவும்',
  'Farming Expense Management': 'விவசாய செலவு மேலாண்மை',
  'Agricultural Income & Mandi Sales': 'விவசாய வரவு மற்றும் மண்டி விற்பனை',
  'Field or Farm Plot Name': 'வயல் அல்லது நிலப் பகுதி பெயர்',
  'Land Area & Unit': 'நிலப்பரப்பு மற்றும் அலகு',
  'Seeding Date *': 'விதைப்பு தேதி *',
  'Expected Harvest Date *': 'எதிர்பார்க்கப்படும் அறுவடை தேதி *',
  'Current Status': 'தற்போதைய நிலை',
  'Planned': 'திட்டமிடப்பட்டது',
  'Growing': 'வளர்கிறது',
  'Ready to Harvest': 'அறுவடைக்குத் தயாராக உள்ளது',
  'Harvested': 'அறுவடை செய்யப்பட்டது',
  'Crop Name or Variety *': 'பயிர் பெயர் அல்லது வகை *',
  'Choose or enter field / plot name': 'வயல் / நிலப் பகுதி பெயரை உள்ளிடவும்',
  'Save Crop Cycle': 'நடவைக் சேமிக்கவும்',
  'Update Crop Cycle': 'நடவைப் புதுப்பிக்கவும்',
  'Close modal': 'சாளரத்தை மூடு',
  'Open calendar': 'நாட்காட்டியைத் திறக்கவும்',
  'Welcome Back': 'மீண்டும் வரவேற்கிறோம்',
  'Email Address': 'மின்னஞ்சல் முகவரி',
  'Password': 'கடவுச்சொல்',
  'Sign In': 'உள்நுழைக',
  'Sign Up': 'பதிவு செய்க',
  'Sign In to Account': 'கணக்கில் உள்நுழைக',
  'Create New Farmer Account': 'புதிய விவசாயி கணக்கை உருவாக்கவும்',
  'Save Changes': 'மாற்றங்களைச் சேமிக்கவும்',
  'Delete': 'நீக்கவும்',
  'Edit': 'திருத்தவும்',
  'Close': 'மூடு',
  'PostgreSQL Active': 'PostgreSQL செயல்பாட்டில் உள்ளது',
  'Demo Mode': 'மாதிரி முறை',
};

Object.assign(tamil, {
  'Income · Expense Ledger': 'வரவு · செலவுக் கணக்குப் புத்தகம்',
  'A single view of your agricultural income and expenses.': 'உங்கள் விவசாய வரவு மற்றும் செலவுகளின் ஒரே பார்வை.',
  'Filter by crop or person': 'பயிர் அல்லது நபர் மூலம் வடிகட்டவும்',
  'Type a new crop name': 'புதிய பயிர் பெயரை உள்ளிடவும்',
  'Added crops are saved to Quick crop choices for future entries.': 'சேர்க்கப்பட்ட பயிர்கள் எதிர்கால பதிவுகளுக்கான விரைவு தேர்வுகளில் சேமிக்கப்படும்.',
  'Type a new expense type': 'புதிய செலவு வகையை உள்ளிடவும்',
  'Added types are saved to the expense type choices.': 'சேர்க்கப்பட்ட வகைகள் செலவு வகை தேர்வுகளில் சேமிக்கப்படும்.',
  'What was this expense for?': 'இந்த செலவு எதற்காக?',
  'What income did you receive?': 'நீங்கள் எந்த வரவைப் பெற்றீர்கள்?',
  'Farmer': 'விவசாயி',
});

const english = Object.fromEntries(Object.entries(tamil).map(([key, value]) => [value, key]));

function translateDocument(language: Language) {
  if (typeof document === 'undefined') return;
  const dictionary = language === 'ta' ? tamil : english;
  const translate = (value: string) => dictionary[value.trim()] || value;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  nodes.forEach((node) => {
    const current = node.nodeValue || '';
    const translated = translate(current);
    if (translated !== current) node.nodeValue = current.replace(current.trim(), translated);
  });
  document.querySelectorAll<HTMLElement>('[placeholder], [title], [aria-label]').forEach((element) => {
    ['placeholder', 'title', 'aria-label'].forEach((attribute) => {
      const current = element.getAttribute(attribute);
      if (current) element.setAttribute(attribute, translate(current));
    });
  });
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'ta' || stored === 'en') setLanguageState(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language);
    translateDocument(language);
    const observer = new MutationObserver(() => translateDocument(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage: setLanguageState }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
