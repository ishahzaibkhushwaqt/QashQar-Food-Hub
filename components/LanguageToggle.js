import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Globe, ChevronDown, Check } from 'lucide-react';

const LANGUAGES = [
  { code: 'kh', name: 'کھوار', subtitle: 'Chitral ki zabaan', flag: '🏔️' },
  { code: 'ur', name: 'اردو', subtitle: 'Urdu', flag: '🇵🇰' },
  { code: 'en', name: 'English', subtitle: 'Global', flag: '🌐' },
];

export default function LanguageToggle({ variant = 'navbar' }) {
  const { language, setLanguage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[2];

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'pill-group') {
    return (
      <div className="inline-flex items-center p-1 bg-cream-200/80 rounded-xl border border-cream-300">
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-gold-500 text-white shadow-xs'
                  : 'text-dark-700 hover:text-gold-600 hover:bg-white/60'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cream-300 bg-white/90 hover:bg-cream-100 text-dark-800 text-xs font-bold transition-all shadow-xs"
        title="Switch language / زبان بدلیں (کھوار / اردو / English)"
        aria-label="Toggle language"
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="font-bold tracking-wide">{currentLang.name}</span>
        <ChevronDown className={`w-3 h-3 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-elevated border border-cream-300 py-2 z-50 animate-fade-in">
          <div className="px-3.5 py-1.5 border-b border-cream-200">
            <p className="text-[10px] font-black uppercase tracking-wider text-dark-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-gold-500" />
              Chitral Languages / زبانہ
            </p>
          </div>

          <div className="py-1">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between text-left transition-colors ${
                    isSelected ? 'bg-gold-50 text-gold-700 font-black' : 'hover:bg-cream-100 text-dark-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <div>
                      <span className="text-xs font-bold block">{lang.name}</span>
                      <span className="text-[10px] text-dark-400">{lang.subtitle}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-gold-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
