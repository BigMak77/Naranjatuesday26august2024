"use client";

import { useTranslation } from '@/context/TranslationContext';
import { useState, useRef, useEffect } from 'react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';

const localeNames = {
  en: 'English',
  pl: 'Polski',
};

export default function LanguageSelector() {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleLocaleChange = (newLocale: 'en' | 'pl') => {
    setIsOpen(false);
    setLocale(newLocale);
  };

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        type="button"
        className="language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('common.selectLanguage')}
        aria-expanded={isOpen}
      >
        <FiGlobe aria-hidden="true" />
        <span className="language-selector-current">
          {localeNames[locale]}
        </span>
        <FiChevronDown
          aria-hidden="true"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s'
          }}
        />
      </button>

      {isOpen && (
        <div className="language-selector-dropdown" role="menu">
          {(['en', 'pl'] as const).map((loc) => (
            <button
              key={loc}
              type="button"
              role="menuitem"
              className={`language-selector-option ${locale === loc ? 'active' : ''}`}
              onClick={() => handleLocaleChange(loc)}
              aria-current={locale === loc ? 'true' : 'false'}
            >
              {localeNames[loc]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
