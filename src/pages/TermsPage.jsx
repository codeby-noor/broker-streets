import { LegalPageLayout, LegalSection, LegalParagraph, LegalList } from '../components/legal/LegalPageLayout';
import { useLanguage } from '../i18n/LanguageContext';

const LAST_UPDATED = '20 August 2026';

function TermsPage() {
    const { t } = useLanguage();

    return (
        <LegalPageLayout title={t('legalPage.termsTitle')} lastUpdated={LAST_UPDATED}>
            <LegalSection>
                <LegalParagraph>
                    {t('terms.intro1')}
                </LegalParagraph>
                <LegalParagraph>
                    {t('terms.intro2')}
                </LegalParagraph>
                <LegalParagraph>
                    {t('terms.intro3')}
                </LegalParagraph>
            </LegalSection>

            <LegalSection title={t('terms.section1Title')}>
                <LegalParagraph>
                    {t('terms.section1Content')}
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="2. Eligibility">
                <LegalParagraph>
                    To use certain features of Broker Streets, you must provide accurate information and create an account.
                </LegalParagraph>
                <LegalParagraph>You represent that:</LegalParagraph>
                <LegalList
                    items={[
                        'The information you provide is accurate and current.',
                        'You are legally capable of entering into an agreement.',
                        'You will use the platform only for lawful purposes.',
                        'You will not impersonate another person.',
                        'You will not create an account using false information.',
                    ]}
                />
                <LegalParagraph>
                    If you are listing a property on behalf of another person, you must have appropriate authorization to do so. Broker Streets is not responsible to verify the ownership of the property and check the false impersonation of the real owner.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="3. User Accounts">
                <LegalParagraph>Broker Streets may allow registration using:</LegalParagraph>
                <LegalList
                    items={[
                        'Email and password',
                        'Google Sign-In',
                        'Mobile OTP - SMS (in future)',
                    ]}
                />
                <LegalParagraph>
                    You are responsible for maintaining the confidentiality of your account credentials. You must notify Broker Streets if you believe your account has been accessed without authorization. Broker Streets reserves the right to suspend or terminate accounts that violate these Terms.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="4. Property Listings">
                <LegalParagraph>Users may submit listings for:</LegalParagraph>
                <LegalList
                    items={[
                        'Agricultural Land',
                        'Non-Agricultural (NA) Land',
                    ]}
                />
                <LegalParagraph>
                    Broker Streets currently does not accept listings for residential properties, commercial properties, industrial properties, rental properties, or other property categories not supported by the platform. Users are responsible for ensuring that all information submitted in a listing is accurate.
                </LegalParagraph>
                <LegalParagraph>This includes, where applicable:</LegalParagraph>
                <LegalList
                    items={[
                        'State',
                        'District',
                        'Taluka',
                        'Village',
                        'Land type',
                        'Price',
                        'Price unit',
                        'Property images',
                        'Property videos',
                        '7/12 documents',
                        'Google Maps location',
                        'Additional property details',
                    ]}
                />
            </LegalSection>

            <LegalSection title="5. Accuracy of Property Information">
                <LegalParagraph>
                    The person submitting a property listing is solely responsible for the accuracy, legality, ownership, and completeness of the information provided.
                </LegalParagraph>
                <LegalParagraph>Broker Streets does not guarantee that:</LegalParagraph>
                <LegalList
                    items={[
                        'The seller is the legal owner.',
                        'The property description is accurate.',
                        'The stated area is accurate.',
                        'The stated price is accurate.',
                        'The property is free from disputes or encumbrances.',
                        'The property has valid permissions.',
                        'The property is legally transferable.',
                        'Documents uploaded by a user are genuine or complete.',
                    ]}
                />
                <LegalParagraph>
                    Users must independently verify all relevant information before entering into any transaction.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="6. Property Documents">
                <LegalParagraph>
                    Users may upload documents such as 7/12 records or other property-related documents. Uploading a document does not mean that Broker Streets has legally verified, certified, or guaranteed the authenticity of that document.
                </LegalParagraph>
                <LegalParagraph>
                    Buyers should independently verify property records, ownership, title, encumbrances, permissions, measurements, land classification, and other relevant matters through appropriate government authorities and qualified legal professionals.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="7. Buyer Requirements">
                <LegalParagraph>
                    Users may submit land requirements through the Buy Listing form.
                </LegalParagraph>
                <LegalParagraph>Information may include:</LegalParagraph>
                <LegalList
                    items={[
                        'State',
                        'District',
                        'Taluka',
                        'Villages',
                        'Land type',
                        'Purpose',
                        'Specific requirements',
                        'Optional voice recording',
                    ]}
                />
                <LegalParagraph>
                    By submitting a requirement, you agree that Broker Streets may use the information to facilitate relevant property opportunities and communicate with you regarding your requirement.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="8. Direct Buyer-Seller Communication">
                <LegalParagraph>
                    Broker Streets may facilitate communication between buyers and sellers.
                </LegalParagraph>
                <LegalParagraph>
                    Broker Streets is not a party to any agreement, negotiation, payment, sale, purchase, transfer, or other transaction between users unless expressly stated. Users are responsible for conducting their own due diligence before entering into any transaction.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="9. No Brokerage / Commission">
                <LegalParagraph>
                    Broker Streets currently does not charge brokerage or commission on transactions conducted between users through the platform. Broker Streets also does not currently charge users subscription fees or listing fees for standard property listings.
                </LegalParagraph>
                <LegalParagraph>
                    This does not mean that users are exempt from government charges, registration fees, stamp duty, taxes, professional fees, legal fees, or any other charges applicable to their transaction.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="10. User-Submitted Content">
                <LegalParagraph>Users may submit:</LegalParagraph>
                <LegalList
                    items={[
                        'Property descriptions',
                        'Images',
                        'Videos',
                        'Documents',
                        'Location information',
                        'Voice recordings',
                        'Other property-related information',
                    ]}
                />
                <LegalParagraph>
                    You represent that you have the right to submit such content and that the content does not knowingly infringe the rights of another person.
                </LegalParagraph>
                <LegalParagraph>
                    Broker Streets may review, moderate, reject, edit for formatting, suspend, or remove content that violates these Terms or appears inaccurate, misleading, fraudulent, unlawful, or inappropriate.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="11. Prohibited Activities">
                <LegalParagraph>You must not:</LegalParagraph>
                <LegalList
                    items={[
                        'Upload false or misleading property information.',
                        'Upload properties you are not authorized to list.',
                        'Upload fraudulent documents.',
                        'Impersonate another person.',
                        'Use the platform for unlawful activities.',
                        'Attempt to scam or defraud another user.',
                        'Upload malicious software or harmful code.',
                        'Attempt to gain unauthorized access to the platform.',
                        'Scrape or systematically copy platform content without permission.',
                        'Use Broker Streets to send spam.',
                        'Create duplicate or misleading listings.',
                        'Use the platform for purposes unrelated to legitimate property activity.',
                    ]}
                />
            </LegalSection>

            <LegalSection title="12. Listing Review and Removal">
                <LegalParagraph>
                    Broker Streets may review listings before or after publication.
                </LegalParagraph>
                <LegalParagraph>We may reject, suspend, modify, or remove a listing if we believe it:</LegalParagraph>
                <LegalList
                    items={[
                        'Contains inaccurate information.',
                        'Violates these Terms.',
                        'Appears fraudulent or suspicious.',
                        'Contains inappropriate content.',
                        'Is a duplicate.',
                        'Has already been sold or is no longer available.',
                        'Violates applicable law.',
                    ]}
                />
                <LegalParagraph>
                    Broker Streets is not required to publish every submitted listing.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="13. Government Links and Third-Party Services">
                <LegalParagraph>
                    Broker Streets may provide links to government websites, third-party websites, calculators, resources, or other external services.
                </LegalParagraph>
                <LegalParagraph>These links are provided for convenience and informational purposes.</LegalParagraph>
                <LegalParagraph>
                    Broker Streets does not control external websites and is not responsible for their availability, accuracy, security, content, or policies.
                </LegalParagraph>
                <LegalParagraph>
                    Users should verify information directly with the relevant authority or service provider.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="14. Intellectual Property">
                <LegalParagraph>
                    The Broker Streets name, logo, website design, software, graphics, text, original content, and other platform materials may be protected by applicable intellectual property laws.
                </LegalParagraph>
                <LegalParagraph>
                    You may not copy, reproduce, modify, distribute, sell, or commercially exploit Broker Streets content without prior written permission, except where permitted by law.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="15. Disclaimer of Warranties">
                <LegalParagraph>
                    Broker Streets provides the platform on an as available basis.
                </LegalParagraph>
                <LegalParagraph>We do not guarantee that:</LegalParagraph>
                <LegalList
                    items={[
                        'Every listing is genuine.',
                        'Every listing is verified.',
                        'Every property is legally transferable.',
                        'Every seller is genuine.',
                        'Every buyer is genuine.',
                        'A transaction will be completed.',
                        'Property information will always be accurate.',
                        'The website will always be available without interruption.',
                    ]}
                />
            </LegalSection>

            <LegalSection title="16. Limitation of Liability">
                <LegalParagraph>
                    To the maximum extent permitted by applicable law, Broker Streets shall not be responsible for losses arising from:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Transactions between users.',
                        'Incorrect property information.',
                        'Fraud committed by users.',
                        'Property disputes.',
                        'Document authenticity.',
                        'Financial losses.',
                        'Delays in transactions.',
                        'Decisions made based on information available on the platform.',
                    ]}
                />
                <LegalParagraph>
                    Nothing in these Terms excludes liability that cannot legally be excluded.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="17. Changes to These Terms">
                <LegalParagraph>
                    Broker Streets may update these Terms from time to time.
                </LegalParagraph>
                <LegalParagraph>
                    Updated Terms will be published on this page with a revised Last Updated date.
                </LegalParagraph>
                <LegalParagraph>
                    Your continued use of the platform after changes are published constitutes acceptance of the updated Terms, to the extent permitted by applicable law.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="18. Contact">
                <LegalParagraph>
                    For questions regarding these Terms:
                </LegalParagraph>
                <LegalParagraph>
                    <span className="font-semibold text-ink">Broker Streets</span>
                    <br />
                    Email: <a href="mailto:vibysolution@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">vibysolution@gmail.com</a>
                    <br />
                    Phone: <a href="tel:9512722011" className="font-medium text-primary underline-offset-4 hover:underline">95127 22011</a>
                </LegalParagraph>
            </LegalSection>
        </LegalPageLayout>
    );
}

export default TermsPage;