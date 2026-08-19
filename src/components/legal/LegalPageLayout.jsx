import { useLanguage } from '../../i18n/LanguageContext';

function LegalPageLayout({ title, lastUpdated, children }) {
    const { t } = useLanguage();

    return (
        <div className="mx-auto w-full max-w-3xl">
            <div className="overflow-hidden rounded-[30px] border border-slate-200 bg-cream shadow-sm">
                <div className="border-b border-slate-200/70 px-6 py-10 sm:px-10 sm:py-12">
                    <p className="eyebrow">Broker Streets</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                        {title}
                    </h1>
                    {lastUpdated && (
                        <p className="mt-4 text-sm text-slate-500">
                            {t('legalPage.lastUpdated')}: <span className="font-semibold text-primary">{lastUpdated}</span>
                        </p>
                    )}
                    <div className="mt-6 h-1 w-16 rounded-full bg-primary" aria-hidden="true" />
                </div>
                <div className="px-6 py-8 sm:px-10 sm:py-10">
                    <div className="space-y-10">{children}</div>
                </div>
            </div>
        </div>
    );
}

function LegalSection({ title, children }) {
    return (
        <section>
            {title && (
                <h2 className="flex items-start gap-3 text-xl font-bold tracking-tight text-ink sm:text-2xl">
                    <span className="mt-2 h-5 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span>{title}</span>
                </h2>
            )}
            <div className="mt-4 space-y-4 text-[15px] leading-7 text-slate-600 sm:text-base sm:leading-7">
                {children}
            </div>
        </section>
    );
}

function LegalSubheading({ children }) {
    return (
        <h3 className="pt-2 text-lg font-bold tracking-tight text-ink sm:text-xl">
            {children}
        </h3>
    );
}

function LegalParagraph({ children }) {
    return <p>{children}</p>;
}

function LegalList({ items }) {
    return (
        <ul className="list-disc space-y-2 pl-5 marker:text-primary">
            {items.map((item, index) => (
                <li key={index} className="pl-1">{item}</li>
            ))}
        </ul>
    );
}

export { LegalPageLayout, LegalSection, LegalSubheading, LegalParagraph, LegalList };