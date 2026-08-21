import { LegalPageLayout, LegalSection, LegalSubheading, LegalParagraph, LegalList } from '../components/legal/LegalPageLayout';
import { useLanguage } from '../i18n/LanguageContext';

const LAST_UPDATED = '20 August 2026';

function PrivacyPage() {
    const { t } = useLanguage();

    return (
        <LegalPageLayout title={t('legalPage.privacyTitle')} lastUpdated={LAST_UPDATED}>
            <LegalSection>
                <LegalParagraph>
                    At Broker Streets, we respect your privacy and are committed to protecting the personal information you provide when using our website and services.
                </LegalParagraph>
                <LegalParagraph>
                    This Privacy Policy explains what information we collect, why we collect it, how we use it, and the choices available to you.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="1. Information We Collect">
                <LegalParagraph>
                    We may collect information when you create an account, submit a Buy Listing, submit a Sell Listing, contact us, or otherwise use our platform.
                </LegalParagraph>

                <LegalSubheading>A. Account Information</LegalSubheading>
                <LegalParagraph>
                    When you register using email and password, we may collect:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Full name',
                        'Email address',
                        'Mobile number',
                        'City',
                        'Password credentials',
                    ]}
                />
                <LegalParagraph>
                    <span className="font-semibold text-ink">Important:</span> Your password should be stored by Broker Streets in a secure, appropriately hashed form. Broker Streets should not store passwords in plain text.
                </LegalParagraph>

                <LegalSubheading>B. Google Sign-In</LegalSubheading>
                <LegalParagraph>
                    If you choose to register or sign in using Google, Google may provide certain account information to us according to the permissions and consent associated with your Google account.
                </LegalParagraph>
                <LegalParagraph>This may include:</LegalParagraph>
                <LegalList
                    items={[
                        'Name',
                        'Email address',
                        'Google account identifier',
                        'Profile information made available through the authentication process',
                    ]}
                />
                <LegalParagraph>
                    We use this information to create and manage your Broker Streets account and provide authentication services.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="2. Information Collected Through Buy Listings">
                <LegalParagraph>
                    If you submit a land requirement through our Buy Listing form, we may collect:
                </LegalParagraph>
                <LegalList
                    items={[
                        'State',
                        'District',
                        'Taluka',
                        'Villages',
                        'Land type',
                        'Purpose',
                        'Your land requirements',
                        'Optional voice recording',
                    ]}
                />
                <LegalParagraph>
                    This information may be used to understand your requirements and connect you with relevant property opportunities.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="3. Information Collected Through Sell Listings">
                <LegalParagraph>
                    If you submit a property through our Sell Listing form, we may collect:
                </LegalParagraph>
                <LegalSubheading>Property information</LegalSubheading>
                <LegalList
                    items={[
                        'State',
                        'District',
                        'Taluka',
                        'Village',
                        'Land type',
                        'Price unit',
                        'Price amount',
                        'Additional property details',
                    ]}
                />
                <LegalSubheading>Property media</LegalSubheading>
                <LegalList
                    items={[
                        'Property photographs',
                        'Property videos',
                    ]}
                />
                <LegalSubheading>Documents</LegalSubheading>
                <LegalList
                    items={[
                        '7/12 documents and other documents uploaded by you',
                    ]}
                />
                <LegalSubheading>Location</LegalSubheading>
                <LegalList
                    items={[
                        'Google Maps link or property location information',
                    ]}
                />
                <LegalParagraph>
                    This information is used to create and manage your property listing.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="4. Contact Information">
                <LegalParagraph>
                    When you contact Broker Streets, we may collect information such as:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Name',
                        'Mobile number',
                        'Email address',
                        'City',
                        'Message or enquiry details',
                    ]}
                />
                <LegalParagraph>
                    We use this information to respond to your inquiry and provide support.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="5. Automatically Collected Information">
                <LegalParagraph>
                    When you use Broker Streets, certain technical information may be collected automatically, such as:
                </LegalParagraph>
                <LegalList
                    items={[
                        'IP address',
                        'Browser type',
                        'Device type',
                        'Operating system',
                        'Pages visited',
                        'Date and time of access',
                        'Referring website',
                        'Basic website usage information',
                    ]}
                />
                <LegalParagraph>
                    We may use this information for security, analytics, performance monitoring, and improving the platform.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="6. How We Use Your Information">
                <LegalParagraph>We may use collected information to:</LegalParagraph>
                <LegalList
                    items={[
                        'Create and manage your account.',
                        'Authenticate users.',
                        'Publish and manage property listings.',
                        'Process Buy Listing requirements.',
                        'Connect buyers and sellers.',
                        'Respond to enquiries.',
                        'Provide customer support.',
                        'Improve our website and services.',
                        'Detects and prevents fraud or misuse.',
                        'Maintain website security.',
                        'Analyze website usage.',
                        'Communicate important service-related information.',
                        'Comply with applicable legal obligations.',
                    ]}
                />
            </LegalSection>

            <LegalSection title="7. Property Information Visibility">
                <LegalParagraph>
                    When you submit a Sell Listing, certain property information may be displayed publicly on Broker Streets.
                </LegalParagraph>
                <LegalParagraph>This may include information such as:</LegalParagraph>
                <LegalList
                    items={[
                        'Property location',
                        'Land type',
                        'Price',
                        'Area/details',
                        'Images',
                        'Videos',
                        'Property description',
                        'Other information included in the listing',
                    ]}
                />
                <LegalParagraph>
                    You should not upload sensitive personal information or documents containing unnecessary personal information unless required for the listing process.
                </LegalParagraph>
                <LegalParagraph>
                    Where a document contains sensitive or unnecessary personal information, users should consider whether it needs to be uploaded and should avoid sharing information that is not necessary for the intended purpose.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="8. Sharing of Information">
                <LegalParagraph>
                    We may share information where reasonably necessary with:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Buyers and sellers using the platform.',
                        'Service providers helping us operate the website.',
                        'Hosting and cloud service providers.',
                        'Authentication providers such as Google.',
                        'Analytics and security service providers.',
                        'Professional advisers where necessary.',
                        'Government authorities or law-enforcement agencies where legally required.',
                    ]}
                />
                <LegalParagraph>
                    We do not intend to sell your personal information as a standalone commercial product.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="9. Data Security">
                <LegalParagraph>
                    We use reasonable technical and organizational measures designed to protect personal information against unauthorized access, alteration, disclosure, misuse, or destruction. However, no internet-based system can be guaranteed to be completely secure. You are also responsible for keeping your account credentials confidential.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="10. Data Retention">
                <LegalParagraph>
                    We retain personal information for as long as reasonably necessary to:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Provide our services.',
                        'Maintain your account.',
                        'Maintain property listings.',
                        'Meet legitimate business requirements.',
                        'Resolve disputes.',
                        'Prevent fraud.',
                        'Comply with applicable legal obligations.',
                    ]}
                />
                <LegalParagraph>
                    When information is no longer required, we may delete, anonymize, or securely dispose of it, subject to applicable legal and operational requirements.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="11. Your Rights and Choices">
                <LegalParagraph>
                    Subject to applicable law, you may have rights relating to your personal information, including rights to:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Request information about your personal data.',
                        'Request correction of inaccurate information.',
                        'Request deletion of personal information where applicable.',
                        'Withdraw consent where processing is based on consent.',
                        'Raise a complaint regarding processing of your personal information.',
                    ]}
                />
                <LegalParagraph>
                    The DPDP framework provides rights and obligations around personal-data processing, and the applicable implementation provisions should be reflected in the final version of this policy and your actual product flows.
                </LegalParagraph>
                <LegalParagraph>
                    To exercise applicable rights or raise a privacy concern, contact:
                </LegalParagraph>
                <LegalParagraph>
                    Email: <a href="mailto:vibysolution@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">vibysolution@gmail.com</a>
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="12. Cookies">
                <LegalParagraph>
                    Broker Streets may use cookies and similar technologies to:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Keep users signed in.',
                        'Remember preferences.',
                        'Improve website functionality.',
                        'Understand website usage.',
                        'Improve performance and security.',
                    ]}
                />
                <LegalParagraph>
                    You may be able to control cookies through your browser settings. Some website functionality may not work properly if certain cookies are disabled.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="13. Third-Party Links">
                <LegalParagraph>
                    Broker Streets may contain links to government websites and other third-party websites. We are not responsible for the privacy practices or content of those external websites. Please review their respective privacy policies before providing personal information.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="14. Children's Privacy">
                <LegalParagraph>
                    Broker Streets is intended for users who are legally capable of using the platform and entering into relevant transactions. We do not knowingly seek to collect personal information from children in violation of applicable law.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="15. Changes to This Privacy Policy">
                <LegalParagraph>
                    We may update this Privacy Policy from time to time.
                </LegalParagraph>
                <LegalParagraph>
                    The latest version will always be published on this page with the updated date.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="16. Contact Us">
                <LegalParagraph>
                    If you have questions, concerns, or requests regarding this Privacy Policy, contact:
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

export default PrivacyPage;