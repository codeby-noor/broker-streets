import { Route, Routes } from 'react-router-dom';
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
import ProfilePage from '../pages/ProfilePage';
import NotFoundPage from '../pages/NotFoundPage';
import BuyerForm from '../pages/BuyerForm';
import SellerForm from '../pages/SellerForm';
import AddPropertyPage from '../pages/AddPropertyPage';
import SellerDashboard from '../pages/SellerDashboard';
import BuyerRequirementsPage from '../pages/BuyerRequirementsPage';
import LocationDetailsPage from '../pages/LocationDetailsPage';
import FormGuard from '../components/FormGuard';
import ProtectedRoute from './ProtectedRoute';
import AdminApp from '../admin/AdminApp';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<RegisterPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="otp" element={<OTPPage />} />
        <Route path="sell" element={<SellPage />} />
        <Route
          path="seller-form"
          element={
            <FormGuard flagKey="sellerFormSubmitted" targetPath="/sell" requireSubmitted={false}>
              <SellerForm />
            </FormGuard>
          }
        />
        <Route element={<ProtectedRoute />}>
          <Route path="home" element={<HomePage />} />
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
            element={
              <FormGuard flagKey="sellerFormSubmitted" formPath="/seller-form" requireSubmitted={true}>
                <AddPropertyPage />
              </FormGuard>
            }
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
          <Route
            path="property/:id"
            element={
              <FormGuard flagKey="buyerFormSubmitted" formPath="/buyer-form" requireSubmitted={true}>
                <PropertyDetailsPage />
              </FormGuard>
            }
          />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="buyer-requirements" element={<BuyerRequirementsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
