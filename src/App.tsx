import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import CookieBanner from "@/components/CookieBanner";
import MobileCtaBar from "@/components/MobileCtaBar";
import ScrollToTop from "@/components/ScrollToTop";
import SupportChat from "@/components/SupportChat";
import YandexMetrika from "@/components/YandexMetrika";
import { useLocation } from "react-router-dom";

import Index from "./pages/Index.tsx";
import Intro from "./pages/Intro.tsx";
import Catalog from "./pages/Catalog.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import NotFound from "./pages/NotFound.tsx";
import Favorites from "./pages/Favorites.tsx";
import CmsPage from "./pages/CmsPage.tsx";
import Quiz from "./pages/Quiz.tsx";
import Account from "./pages/Account.tsx";
import Unsubscribe from "./pages/Unsubscribe.tsx";
import EmailUnsubscribe from "./pages/EmailUnsubscribe.tsx";
import PromoClaim from "./pages/PromoClaim.tsx";

import AdminLogin from "./pages/admin/AdminLogin.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import ProductsList from "./pages/admin/ProductsList.tsx";
import ProductEdit from "./pages/admin/ProductEdit.tsx";
import ProductsImport from "./pages/admin/ProductsImport.tsx";
import BrandsAdmin from "./pages/admin/BrandsAdmin.tsx";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin.tsx";
import StoresAdmin from "./pages/admin/StoresAdmin.tsx";
import BannersAdmin from "./pages/admin/BannersAdmin.tsx";
import SocialAdmin from "./pages/admin/SocialAdmin.tsx";
import PagesAdmin from "./pages/admin/PagesAdmin.tsx";
import UsersAdmin from "./pages/admin/UsersAdmin.tsx";
import NewsletterAdmin from "./pages/admin/NewsletterAdmin.tsx";
import CampaignsAdmin from "./pages/admin/CampaignsAdmin.tsx";
import CampaignEdit from "./pages/admin/CampaignEdit.tsx";
import PromoCodesAdmin from "./pages/admin/PromoCodesAdmin.tsx";
import ReviewsAdmin from "./pages/admin/ReviewsAdmin.tsx";
import StockAlertsAdmin from "./pages/admin/StockAlertsAdmin.tsx";
import SupportAdmin from "./pages/admin/SupportAdmin.tsx";

const queryClient = new QueryClient();

const Protected = ({ children, admin }: { children: any; admin?: boolean }) => (
  <ProtectedRoute require={admin ? "admin" : "editor"}>{children}</ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <YandexMetrika />
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/page/:slug" element={<CmsPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={<Account />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/email-unsubscribe" element={<EmailUnsubscribe />} />
            <Route path="/promo-claim" element={<PromoClaim />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Protected><Dashboard /></Protected>} />
            <Route path="/admin/products" element={<Protected><ProductsList /></Protected>} />
            <Route path="/admin/products/import" element={<Protected><ProductsImport /></Protected>} />
            <Route path="/admin/products/:id" element={<Protected><ProductEdit /></Protected>} />
            <Route path="/admin/brands" element={<Protected><BrandsAdmin /></Protected>} />
            <Route path="/admin/categories" element={<Protected><CategoriesAdmin /></Protected>} />
            <Route path="/admin/stores" element={<Protected><StoresAdmin /></Protected>} />
            <Route path="/admin/banners" element={<Protected><BannersAdmin /></Protected>} />
            <Route path="/admin/social" element={<Protected><SocialAdmin /></Protected>} />
            <Route path="/admin/pages" element={<Protected><PagesAdmin /></Protected>} />
            <Route path="/admin/users" element={<Protected admin><UsersAdmin /></Protected>} />
            <Route path="/admin/newsletter" element={<Protected><NewsletterAdmin /></Protected>} />
            <Route path="/admin/campaigns" element={<Protected><CampaignsAdmin /></Protected>} />
            <Route path="/admin/campaigns/:id" element={<Protected><CampaignEdit /></Protected>} />
            <Route path="/admin/promo" element={<Protected><PromoCodesAdmin /></Protected>} />
            <Route path="/admin/reviews" element={<Protected><ReviewsAdmin /></Protected>} />
            <Route path="/admin/stock-alerts" element={<Protected><StockAlertsAdmin /></Protected>} />
            <Route path="/admin/support" element={<Protected><SupportAdmin /></Protected>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieBanner />
          <MobileCtaGate />
          <SupportChatGate />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// Чат не показываем в админке и на /intro (презентация).
const SupportChatGate = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  if (pathname === "/intro") return null;
  return <SupportChat />;
};

// MobileCtaBar «В магазин» не показываем в админке и на /intro.
const MobileCtaGate = () => {
  const { pathname } = useLocation();
  if (pathname.startsWith("/admin")) return null;
  if (pathname === "/intro") return null;
  return <MobileCtaBar />;
};

export default App;
