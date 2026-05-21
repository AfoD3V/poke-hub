'use client';

import styles from './LanguageSelector.module.css';

const LANGUAGES = [
  { code: 'en', label: 'English'    },
  { code: 'ja', label: 'Japanese'   },
  { code: 'fr', label: 'French'     },
  { code: 'de', label: 'German'     },
  { code: 'es', label: 'Spanish'    },
  { code: 'it', label: 'Italian'    },
  { code: 'pt', label: 'Portuguese' },
];

export interface LanguageSelectorProps {
  value?: string;
  onChange?: (code: string) => void;
}

export function LanguageSelector({ value = 'en', onChange }: LanguageSelectorProps) {
  return (
    <select
      className={styles['language-selector']}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      aria-label="Search language"
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.code} value={lang.code}>{lang.label}</option>
      ))}
    </select>
  );
}
