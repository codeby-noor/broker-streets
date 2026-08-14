import { useLanguage } from '../i18n/LanguageContext';

/**
 * Compact segmented language toggle for the Master Group panel.
 * Uses the existing LanguageContext / i18n system (same as the customer site).
 * Persists via the existing localStorage mechanism (brokerStreetsLanguage).
 */
function AdminLanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="admin-lang-toggle" role="group" aria-label="Language / ભાષા">
            <button
                type="button"
                className={`admin-lang-btn ${language === 'en' ? 'active' : ''}`}
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
            >
                EN
            </button>
            <button
                type="button"
                className={`admin-lang-btn ${language === 'gu' ? 'active' : ''}`}
                onClick={() => setLanguage('gu')}
                aria-pressed={language === 'gu'}
            >
                ગુજરાતી
            </button>
        </div>
    );
}

export default AdminLanguageToggle;