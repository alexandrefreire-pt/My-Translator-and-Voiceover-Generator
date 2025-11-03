
import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGES } from '../constants';
import { ChevronDownIcon } from './Icons';

interface LanguageSelectorProps {
  selectedLanguages: string[];
  onChange: (selected: string[]) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguages, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelect = (langCode: string) => {
    const newSelection = selectedLanguages.includes(langCode)
      ? selectedLanguages.filter(l => l !== langCode)
      : [...selectedLanguages, langCode];
    onChange(newSelection);
  };

  const getButtonText = () => {
    if (selectedLanguages.length === 0) return 'Select languages...';
    if (selectedLanguages.length === 1) {
        const lang = LANGUAGES.find(l => l.code === selectedLanguages[0]);
        return lang ? lang.name : '1 language selected';
    }
    return `${selectedLanguages.length} languages selected`;
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-left bg-gray-dark border rounded-md border-gray-medium focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        <span>{getButtonText()}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-gray-dark border rounded-md shadow-lg max-h-60 overflow-y-auto border-gray-medium">
          <ul className="py-1">
            {LANGUAGES.map(lang => (
              <li
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="flex items-center px-4 py-2 cursor-pointer hover:bg-gray-medium"
              >
                <input
                  type="checkbox"
                  checked={selectedLanguages.includes(lang.code)}
                  readOnly
                  className="w-4 h-4 mr-3 rounded text-brand-primary bg-gray-medium border-gray-light focus:ring-brand-secondary"
                />
                <span>{lang.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
