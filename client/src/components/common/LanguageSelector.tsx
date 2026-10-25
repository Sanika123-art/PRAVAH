import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageSelector: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="inline-flex items-center gap-1.5">
      <Languages aria-hidden="true" className="w-4 h-4 text-gov-saffron-500" />
      {!compact && <span className="sr-only">{t('Language')}</span>}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'hi')}
        aria-label={t('Language')}
        className="rounded border border-slate-500 bg-slate-900 px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
      >
        <option value="en">English</option>
        <option value="hi">हिंदी</option>
      </select>
    </label>
  );
};
