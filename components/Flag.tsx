import React from 'react';
import { LANGUAGE_TO_FLAG_CODE, LANGUAGES } from '../constants';

interface FlagProps {
  languageCode: string;
  className?: string;
}

const Flag: React.FC<FlagProps> = ({ languageCode, className }) => {
    const countryCode = LANGUAGE_TO_FLAG_CODE[languageCode.toLowerCase()];
    
    // Find the language name for the alt text, providing better accessibility
    const languageName = LANGUAGES.find(l => l.code === languageCode)?.name || languageCode;

    if (!countryCode) {
        // Fallback to a generic emoji flag if no mapping exists for the language code
        return <span className={className} role="img" aria-label={`Flag for ${languageName}`}>🏳️</span>;
    }
    
    // Use a reliable CDN for flag images to ensure they render correctly everywhere.
    // Using PNG with a fixed width for consistency.
    const flagImageUrl = `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;

    return (
        <img
            src={flagImageUrl}
            alt={`Flag for ${languageName}`}
            width="20"
            height="15"
            // The className prop is retained for any additional styling from the parent component.
            className={className}
        />
    );
};

export default Flag;
