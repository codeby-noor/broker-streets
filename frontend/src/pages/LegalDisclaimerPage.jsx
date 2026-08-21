import { LegalPageLayout, LegalSection, LegalParagraph, LegalList } from '../components/legal/LegalPageLayout';
import { useLanguage } from '../i18n/LanguageContext';

function LegalDisclaimerPage() {
    const { t } = useLanguage();

    return (
        <LegalPageLayout title={t('legalPage.disclaimerTitle')}>
            <LegalSection>
                <LegalParagraph>
                    Broker Streets is an online marketplace that facilitates the discovery and connection of buyers and sellers of agricultural and non-agricultural (NA) land.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="Property Verification">
                <LegalParagraph>
                    Information displayed on Broker Streets may be provided by property owners, sellers, agents, or other users. While Broker Streets may review or moderate listings, publication of a listing does not by itself constitute a legal verification, title certification, ownership certification, or guarantee of the property.
                </LegalParagraph>
                <LegalParagraph>
                    Users should independently verify:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Ownership',
                        'Title',
                        'Survey details',
                        '7/12 records',
                        '8A records where relevant',
                        'Encumbrances',
                        'Litigation',
                        'Land classification',
                        'NA status/permissions',
                        'Government restrictions',
                        'Measurements',
                        'Road access',
                        'Location',
                        'Applicable approvals',
                        'Taxes and dues',
                        'Transferability',
                    ]}
                />
                <LegalParagraph>
                    before entering into any transaction.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="No Legal or Financial Advice">
                <LegalParagraph>
                    Information provided through Broker Streets, including articles, guides, calculators, government links, property information, and other resources, is for general informational purposes only. It should not be treated as legal, financial, tax, investment, valuation, or professional advice. Users should consult appropriately qualified professionals before making decisions relating to land transactions.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="Government Services">
                <LegalParagraph>
                    Broker Streets may provide links to government portals and services for convenience. Broker Streets does not operate or control those government websites and does not guarantee the accuracy, availability, or completeness of information obtained from them. Users should rely on the relevant government authority for official records and services.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="Transactions Between Users">
                <LegalParagraph>
                    Broker Streets is not a party to transactions between buyers and sellers.
                </LegalParagraph>
                <LegalParagraph>
                    We do not guarantee:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Completion of a transaction.',
                        'Accuracy of negotiations.',
                        'Payment by a buyer.',
                        'Delivery or transfer of property.',
                        'Legal validity of a transaction.',
                        'Authenticity of documents.',
                        'Ownership of a property.',
                    ]}
                />
                <LegalParagraph>
                    Any agreement entered into between users is their responsibility.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="No Brokerage">
                <LegalParagraph>
                    Broker Streets does not currently charge brokerage or commission for transactions between buyers and sellers.
                </LegalParagraph>
                <LegalParagraph>
                    However, buyers and sellers may independently incur costs such as:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Stamp duty',
                        'Registration fees',
                        'Taxes',
                        'Legal fees',
                        'Survey fees',
                        'Professional consultation fees',
                        'Government charges',
                        'Other transaction-related expenses',
                    ]}
                />
            </LegalSection>

            <LegalSection title="Fraud & Suspicious Listings">
                <LegalParagraph>
                    Users should exercise caution when dealing with other users.
                </LegalParagraph>
                <LegalParagraph>
                    Never transfer money solely on the basis of information displayed on Broker Streets.
                </LegalParagraph>
                <LegalParagraph>
                    If you believe a listing is fraudulent, misleading, duplicated, or suspicious, report it to us immediately.
                </LegalParagraph>
                <LegalParagraph>
                    Report Listing on email :{' '}
                    <a href="mailto:vibysolution@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">vibysolution@gmail.com</a>{' '}
                    or Whatsapp Us :{' '}
                    <a href="tel:9512722011" className="font-medium text-primary underline-offset-4 hover:underline">9512722011</a>
                </LegalParagraph>
            </LegalSection>
        </LegalPageLayout>
    );
}

export default LegalDisclaimerPage;