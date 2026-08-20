import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from '../layouts/Layout';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import OTPPage from '../pages/OTPPage';
import HomePage from '../pages/HomePage';
import BuyPage from '../pages/BuyPage';
import SellPage from '../pages/SellPage';
import PropertyDetailsPage from '../pages/PropertyDetailsPage';
import AboutPage from '../pages/AboutPage';
import ContactPage from '../pages/ContactPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import LegalDisclaimerPage from '../pages/LegalDisclaimerPage';
import ListingPolicyPage from '../pages/ListingPolicyPage';
import ProfilePage from '../pages/ProfilePage';
import ProfilePropertiesPage from '../pages/ProfilePropertiesPage';
import ProfileSavedPage from '../pages/ProfileSavedPage';
import ProfileRequirementsPage from '../pages/ProfileRequirementsPage';
import ProfileRecentPage from '../pages/ProfileRecentPage';
import ProfileNotificationsPage from '../pages/ProfileNotificationsPage';
import ProfileSettingsPage from '../pages/ProfileSettingsPage';
import NotFoundPage from '../pages/NotFoundPage';
import BuyerForm from '../pages/BuyerForm';
import SellerForm from '../pages/SellerForm';
import SellerDashboard from '../pages/SellerDashboard';
import BuyerRequirementsPage from '../pages/BuyerRequirementsPage';
import BuyerRequirementDetailsPage from '../pages/BuyerRequirementDetailsPage';
import LocationDetailsPage from '../pages/LocationDetailsPage';
import FormGuard from '../components/FormGuard';
import ProtectedRoute from './ProtectedRoute';
import AdminApp from '../admin/AdminApp';
import LanguageSelectionPage from '../pages/LanguageSelectionPage';
import { useLanguage } from '../i18n/LanguageContext';

import SellListingsPage from '../pages/SellListingsPage';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/master-group/*" element={<AdminApp />} />
      
      {/* Standalone Authentication Routes (Render AuthHeader only) */}
      <Route path="/" element={<RegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/otp" element={<OTPPage />} />
      <Route path="/language-selection" element={<LanguageSelectionPage />} />

      {/* Main Public Application Routes (Render Navbar, Footer, MobileBottomNav via Layout) */}
      <Route element={<Layout />}>
        <Route path="home" element={<HomePage />} />
        <Route path="sell" element={<SellPage />} />
        <Route path="sell-listings" element={<SellListingsPage />} />
        <Route
          path="seller-form"
          element={
            <FormGuard flagKey="sellerFormSubmitted" targetPath="/sell" requireSubmitted={false}>
              <SellerForm />
            </FormGuard>
          }
        />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="legal-disclaimer" element={<LegalDisclaimerPage />} />
        <Route path="listing-policy" element={<ListingPolicyPage />} />
        <Route path="404" element={<NotFoundPage />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="buyer-form"
            element={
              <FormGuard flagKey="buyerFormSubmitted" targetPath="/buy" requireSubmitted={false}>
                <BuyerForm />
              </FormGuard>
            }
          />
          <Route
            path="add-property"
            element={<Navigate to="/seller-form" replace />}
          />
          <Route
            path="seller-dashboard"
            element={
              <FormGuard flagKey="sellerFormSubmitted" formPath="/seller-form" requireSubmitted={true}>
                <SellerDashboard />
              </FormGuard>
            }
          />
          <Route
            path="buy"
            element={
              <FormGuard flagKey="buyerFormSubmitted" formPath="/buyer-form" requireSubmitted={true}>
                <BuyPage />
              </FormGuard>
            }
          />
          <Route
            path="location/:slug"
            element={
              <FormGuard flagKey="buyerFormSubmitted" formPath="/buyer-form" requireSubmitted={true}>
                <LocationDetailsPage />
              </FormGuard>
            }
          />
          <Route path="property/:id" element={<PropertyDetailsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/properties" element={<ProfilePropertiesPage />} />
          <Route path="profile/saved" element={<ProfileSavedPage />} />
          <Route path="profile/requirements" element={<ProfileRequirementsPage />} />
          <Route path="profile/recent" element={<ProfileRecentPage />} />
          <Route path="profile/notifications" element={<ProfileNotificationsPage />} />
          <Route path="profile/settings" element={<ProfileSettingsPage />} />
          <Route path="buyer-requirements" element={<BuyerRequirementsPage />} />
          <Route path="buyer-requirement/:id" element={<BuyerRequirementDetailsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
