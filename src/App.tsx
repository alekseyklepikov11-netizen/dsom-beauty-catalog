import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import CartDrawer from "@/components/cart/CartDrawer";
import ProtectedRoute from "@/components/ProtectedRoute";
import CookieBanner from "@/components/CookieBanner";
import MobileCtaBar from "@/components/MobileCtaBar";
import ScrollToTop from "@/components/ScrollToTop";
import SupportChat from "@/components/SupportChat";
import YandexMetrika from "@/components/YandexMetrika";

// Главная грузится сразу (самый частый вход) — без задержки на первый экран.
import Index from "./pages/Index.tsx";

// Остальные страницы — по требованию (route-based code splitting), чтобы первый
// бандл оставался лёгким. Тяжёлая админка (~20 страниц) посетителю не грузится вовсе.
const Intro = lazy(() => import("./pages/Intro.tsx"));
const Catalog = lazy(() => import("./pages/Catalog.tsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.tsx"));
const AuthPage = lazy(() => import("./pages/AuthPage.tsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Favorites = lazy(() => import("./pages/Favorites.tsx"));
const CmsPage = lazy(() => import("./pages/CmsPage.tsx"));
const Journal = lazy(() => import("./pages/Journal.tsx"));
const Quiz = lazy(() => import("./pages/Quiz.tsx"));
const Account = lazy(() => import("./pages/Account.tsx"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe.tsx"));
const EmailUnsubscribe = lazy(() => import("./pages/EmailUnsubscribe.tsx"));
const PromoClaim = lazy(() => import("./pages/PromoClaim.tsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.tsx"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin.tsx"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const ProductsList = lazy(() => import("./pages/admin/ProductsList.tsx"));
const ProductEdit = lazy(() => import("./pages/admin/ProductEdit.tsx"));
const ProductsImport = lazy(() => import("./pages/admin/ProductsImport.tsx"));
const BrandsAdmin = lazy(() => import("./pages/admin/BrandsAdmin.tsx"));
const CategoriesAdmin = lazy(() => import("./pages/admin/CategoriesAdmin.tsx"));
const StoresAdmin = lazy(() => import("./pages/admin/StoresAdmin.tsx"));
const BannersAdmin = lazy(() => import("./pages/admin/BannersAdmin.tsx"));
const SocialAdmin = lazy(() => import("./pages/admin/SocialAdmin.tsx"));
const PagesAdmin = lazy(() => import("./pages/admin/PagesAdmin.tsx"));
const UsersAdmin = lazy(() => import("./pages/admin/UsersAdmin.tsx"));
const NewsletterAdmin = lazy(() => import("./pages/admin/NewsletterAdmin.tsx"));
const CampaignsAdmin = lazy(() => import("./pages/admin/CampaignsAdmin.tsx"));
const CampaignEdit = lazy(() => import("./pages/admin/CampaignEdit.tsx"));
const PromoCodesAdmin = lazy(() => import("./pages/admin/PromoCodesAdmin.tsx"));
const ReviewsAdmin = lazy(() => import("./pages/admin/ReviewsAdmin.tsx"));
const StockAlertsAdmin = lazy(() => import("./pages/admin/StockAlertsAdmin.tsx"));
const SupportAdmin = lazy(() => import("./pages/admin/SupportAdmin.tsx"));

const queryClient = new QueryClient();

const Protected = ({ children, admin }: { children: any; admin?: boolean }) => (
  <ProtectedRoute require={admin ? "admin" : "editor"}>{children}</ProtectedRoute>
);

// Минимальный фолбэк на время подгрузки чанка маршрута — в фирменной палитре.
const RouteFallback = () => (
  <div className="min-h-screen grid place-items-center bg-background">
    <div
      className="h-6 w-6 rounded-full border-2 border-foreground/20 border-t-foreground/70 animate-spin"
      role="status"
      aria-label="Загрузка"
    />
  </div>
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
          <CartProvider>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/page/:slug" element={<CmsPage />} />
            <Route path="/journal" element={<Journal />} />
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

            <Route path="/checkout" element={<CheckoutPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <CookieBanner />
          <MobileCtaGate />
          <SupportChatGate />
          <CartDrawer />
          </CartProvider>
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
