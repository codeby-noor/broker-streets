import { LegalPageLayout, LegalSection, LegalParagraph, LegalList } from '../components/legal/LegalPageLayout';
import { useLanguage } from '../i18n/LanguageContext';

const LAST_UPDATED = '20 August 2026';

function ListingPolicyPage() {
    const { t } = useLanguage();

    return (
        <LegalPageLayout title={t('legalPage.listingPolicyTitle')} lastUpdated={LAST_UPDATED}>
            <LegalSection>
                <LegalParagraph>
                    This Listing Policy explains the requirements and guidelines for creating and publishing property listings on Broker Streets. By submitting a property listing, you agree to follow this policy, our Terms & Conditions, Privacy Policy, and Legal Disclaimer.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="1. What Can Be Listed">
                <LegalParagraph>
                    Broker Streets currently accepts listings for:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Agricultural Land',
                        'Non-Agricultural (NA) Land',
                    ]}
                />
                <LegalParagraph>
                    Listings must be located within the geographical areas currently supported by Broker Streets. Broker Streets may expand its supported locations and property categories in the future.
                </LegalParagraph>
                <LegalParagraph>
                    <span className="font-semibold text-ink">Currently Not Accepted</span> - Broker Streets does not currently accept listings for:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Residential properties',
                        'Apartments or houses',
                        'Commercial properties',
                        'Industrial properties',
                        'Rental properties',
                        'Offices or shops',
                        'Other property types not supported by the platform',
                    ]}
                />
            </LegalSection>

            <LegalSection title="2. Accurate Property Information">
                <LegalParagraph>
                    All information submitted in a listing must be accurate, complete, and up to date to the best of the user's knowledge.
                </LegalParagraph>
                <LegalParagraph>This includes:</LegalParagraph>
                <LegalList
                    items={[
                        'District',
                        'Taluka',
                        'Village',
                        'Land type',
                        'Land area',
                        'Price',
                        'Price unit',
                        'Property location',
                        'Property description',
                        'Road access',
                        'Water availability',
                        'Other property-related details',
                    ]}
                />
                <LegalParagraph>
                    Do not intentionally provide false, misleading, exaggerated, or incomplete information.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="3. Seller Authorization">
                <LegalParagraph>
                    You must have the legal right or appropriate authorization to list a property on Broker Streets.
                </LegalParagraph>
                <LegalParagraph>You must not list:</LegalParagraph>
                <LegalList
                    items={[
                        'Property owned by another person without authorization.',
                        'Property you do not have authority to sell.',
                        'Fake or fictitious properties.',
                        "Properties using another person's identity without permission.",
                    ]}
                />
                <LegalParagraph>
                    If you are listing property on behalf of an owner, you should have appropriate authorization from the owner.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="4. Property Documents">
                <LegalParagraph>
                    Where requested, sellers may be required to provide supporting documents such as:
                </LegalParagraph>
                <LegalList
                    items={[
                        '7/12 records',
                        '8A records',
                        'Property-related documents',
                        'Other documents required for listing review',
                    ]}
                />
                <LegalParagraph>
                    Documents submitted must be genuine and must not be altered, forged, or misleading. Uploading a document to Broker Streets does not mean that Broker Streets has legally certified the document, verified ownership, or guaranteed the property's title. Buyers should independently verify all property documents through the relevant government authorities and qualified professionals before completing a transaction.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="5. Property Images & Videos">
                <LegalParagraph>
                    Images and videos uploaded to a listing must:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Relate to the actual property.',
                        'Be reasonably clear and relevant.',
                        'Not intentionally misrepresent the property.',
                        'Not contain illegal or inappropriate content.',
                        'Not be copied from another property listing without permission.',
                    ]}
                />
                <LegalParagraph>
                    Do not use stock images or photographs of another property to represent the listed property.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="6. Location Information">
                <LegalParagraph>
                    Sellers must provide the correct property location to the best of their knowledge. If a Google Maps link is provided, it should correspond to the listed property. Providing an intentionally incorrect location may result in the listing being rejected or removed.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="7. Pricing">
                <LegalParagraph>
                    The price displayed on a listing should represent the seller's current asking price or intended sale price. Sellers should clearly select the appropriate price unit and enter the correct amount. Broker Streets does not determine, guarantee, or certify the market value of any property.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="8. Listing Review">
                <LegalParagraph>
                    Broker Streets may review listings before or after publication.
                </LegalParagraph>
                <LegalParagraph>Our review may include checking whether:</LegalParagraph>
                <LegalList
                    items={[
                        'The required information has been provided.',
                        'The listing falls within our supported property categories.',
                        'The listing contains inappropriate or prohibited content.',
                        'The information appears incomplete, misleading, or suspicious.',
                        'The listing appears to be a duplicate.',
                    ]}
                />
                <LegalParagraph>
                    A listing being published on Broker Streets does not mean that the property has been legally verified or that the seller has been certified as the legal owner.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="9. Listing Rejection or Removal">
                <LegalParagraph>
                    Broker Streets reserves the right to reject, suspend, edit, restrict, or remove a listing where we reasonably believe that it:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Contains false or misleading information.',
                        'Contains fraudulent or suspicious documents.',
                        'Uses unauthorized images or content.',
                        'Is a duplicate listing.',
                        'Has already been sold or is no longer available.',
                        'Violates this Listing Policy.',
                        'Violates our Terms & Conditions.',
                        'Violates applicable law.',
                        'Creates a risk to users or the platform.',
                    ]}
                />
                <LegalParagraph>
                    We may also request additional information or documentation before publishing or continuing to display a listing.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="10. Duplicate Listings">
                <LegalParagraph>
                    Users should not submit multiple duplicate listings for the same property.
                </LegalParagraph>
                <LegalParagraph>
                    If the same property is listed multiple times, Broker Streets may combine, reject, or remove duplicate listings.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="11. Sold or Unavailable Properties">
                <LegalParagraph>
                    Sellers are responsible for keeping their listings updated.
                </LegalParagraph>
                <LegalParagraph>
                    If a property is:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Sold',
                        'Under agreement',
                        'No longer available',
                        'Temporarily unavailable',
                        'Significantly changed',
                    ]}
                />
                <LegalParagraph>
                    The seller should update the listing or notify Broker Streets. Broker Streets may remove or mark listings as unavailable when we become aware that they are no longer active.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="12. Prohibited Content">
                <LegalParagraph>Listings must not contain:</LegalParagraph>
                <LegalList
                    items={[
                        'Fraudulent information.',
                        'Fake documents.',
                        'Misleading claims.',
                        'Abusive or offensive language.',
                        'Discriminatory content.',
                        'Illegal content.',
                        'Malware or malicious links.',
                        'Spam.',
                        'Content unrelated to the property.',
                        'Personal information belonging to another person without authorization.',
                    ]}
                />
            </LegalSection>

            <LegalSection title="13. Personal Information">
                <LegalParagraph>
                    Do not include unnecessary personal information in property descriptions, images, documents, videos, or other listing content.
                </LegalParagraph>
                <LegalParagraph>For example, avoid publicly displaying:</LegalParagraph>
                <LegalList
                    items={[
                        'Aadhaar numbers',
                        'PAN numbers',
                        'Bank account details',
                        'Passwords',
                        'OTPs',
                        'Private contact information belonging to another person',
                        'Other sensitive personal information',
                    ]}
                />
                <LegalParagraph>
                    Broker Streets may remove or restrict content containing unnecessary personal information.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="14. Seller Responsibility">
                <LegalParagraph>
                    The seller is solely responsible for:
                </LegalParagraph>
                <LegalList
                    items={[
                        'The accuracy of the listing.',
                        'The authenticity of submitted documents.',
                        'Their authority to sell the property.',
                        'Negotiating with buyers.',
                        'Completing the transaction.',
                        'Completing required legal and government procedures.',
                        'Paying applicable taxes, duties, registration fees, and other charges.',
                    ]}
                />
                <LegalParagraph>
                    Broker Streets does not guarantee that a listing will receive enquiries or result in a successful transaction.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="15. Buyer Responsibility">
                <LegalParagraph>
                    Buyers should conduct independent due diligence before purchasing any property listed on Broker Streets.
                </LegalParagraph>
                <LegalParagraph>This may include verifying:</LegalParagraph>
                <LegalList
                    items={[
                        'Ownership',
                        'Title',
                        '7/12 records',
                        '8A records',
                        'Land classification',
                        'NA status',
                        'Encumbrances',
                        'Litigation',
                        'Government restrictions',
                        'Survey and measurement details',
                        'Road access',
                        'Taxes and dues',
                        'Required permissions and approvals',
                    ]}
                />
                <LegalParagraph>
                    Buyers should consult appropriate legal, financial, land/revenue, or other qualified professionals where necessary.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="16. No Guarantee of Transaction">
                <LegalParagraph>
                    Broker Streets is a marketplace that facilitates connections between users.
                </LegalParagraph>
                <LegalParagraph>
                    We do not guarantee:
                </LegalParagraph>
                <LegalList
                    items={[
                        'That a property will be sold.',
                        'That a buyer will purchase a property.',
                        'That information provided by a user is completely accurate.',
                        'That a seller has a clear title.',
                        'That a property is free from disputes.',
                        'That a transaction will be completed.',
                    ]}
                />
                <LegalParagraph>
                    Any agreement or transaction between a buyer and seller is entered into at their own responsibility.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="17. Free Listings & No Brokerage">
                <LegalParagraph>
                    Broker Streets currently allows users to list properties without:
                </LegalParagraph>
                <LegalList
                    items={[
                        'Listing fees',
                        'Subscription charges',
                        'Brokerage or commission on the transaction',
                    ]}
                />
                <LegalParagraph>
                    However, users remain responsible for any government charges, taxes, registration fees, legal fees, professional fees, or other costs associated with their property transaction.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="18. Reporting a Listing">
                <LegalParagraph>
                    If you believe that a listing contains incorrect, fraudulent, misleading, or inappropriate information, you can report it to Broker Streets.
                </LegalParagraph>
                <LegalParagraph>
                    When reporting a listing, provide as much relevant information as possible so that we can review the concern.
                </LegalParagraph>
                <LegalParagraph>
                    Report Listing to this email :{' '}
                    <a href="mailto:vibysolution@gmail.com" className="font-medium text-primary underline-offset-4 hover:underline">vibysolution@gmail.com</a>{' '}
                    or Whatsapp Us :{' '}
                    <a href="tel:9512722011" className="font-medium text-primary underline-offset-4 hover:underline">9512722011</a>
                </LegalParagraph>
                <LegalParagraph>
                    Broker Streets may investigate reported listings and take appropriate action where necessary.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="19. Changes to the Listing Policy">
                <LegalParagraph>
                    Broker Streets may update this Listing Policy from time to time to reflect changes in our platform, services, legal requirements, or listing practices.
                </LegalParagraph>
                <LegalParagraph>
                    The latest version will be published on this page with the applicable Last Updated date.
                </LegalParagraph>
            </LegalSection>

            <LegalSection title="20. Contact Us">
                <LegalParagraph>
                    If you have questions regarding this Listing Policy or a listing on Broker Streets, contact us:
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

export default ListingPolicyPage;