import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageSelector: React.FC<{ compact?: boolean; variant?: 'dark' | 'light' }> = ({
  compact = false,
  variant = 'dark',
}) => {
  const { language, setLanguage, t } = useLanguage();

  const selectStyle =
    variant === 'light'
      ? 'rounded-sm border border-[#17202B] bg-white px-2 py-0.5 text-xs font-bold text-[#17202B] shadow-[1px_1px_0px_#17202B] focus:outline-none focus:ring-1 focus:ring-[#E98232]'
      : 'rounded-sm border border-[#3E556E] bg-[#0A1B38] px-2 py-0.5 text-xs font-bold text-[#FAF9F6] shadow-[1px_1px_0px_#071224] focus:outline-none focus:ring-1 focus:ring-[#E98232]';

  return (
    <label className="inline-flex items-center gap-1.5">
      <Languages aria-hidden="true" className="w-3.5 h-3.5 text-[#E98232] flex-shrink-0" />
      {!compact && <span className="sr-only">{t('Language')}</span>}
      <select
        value={language}
        onChange={(event) => setLanguage(event.target.value as 'en' | 'hi')}
        aria-label={t('Language')}
        className={selectStyle}
      >
        <option value="en">English (EN)</option>
        <option value="hi">हिंदी (HI)</option>
      </select>
    </label>
  );
};
