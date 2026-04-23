import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index.tsx";
import Catalog from "./pages/Catalog.tsx";
import ProductPage from "./pages/ProductPage.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import Favorites from "./pages/Favorites.tsx";
import CmsPage from "./pages/CmsPage.tsx";

import AdminLogin from "./pages/admin/AdminLogin.tsx";
import Dashboard from "./pages/admin/Dashboard.tsx";
import ProductsList from "./pages/admin/ProductsList.tsx";
import ProductEdit from "./pages/admin/ProductEdit.tsx";
import BrandsAdmin from "./pages/admin/BrandsAdmin.tsx";
import CategoriesAdmin from "./pages/admin/CategoriesAdmin.tsx";
import StoresAdmin from "./pages/admin/StoresAdmin.tsx";
import BannersAdmin from "./pages/admin/BannersAdmin.tsx";
import SocialAdmin from "./pages/admin/SocialAdmin.tsx";
import PagesAdmin from "./pages/admin/PagesAdmin.tsx";
import UsersAdmin from "./pages/admin/UsersAdmin.tsx";
import NewsletterAdmin from "./pages/admin/NewsletterAdmin.tsx";
import PromoCodesAdmin from "./pages/admin/PromoCodesAdmin.tsx";

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
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/page/:slug" element={<CmsPage />} />
            <Route path="/auth" element={<AuthPage />} />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<Protected><Dashboard /></Protected>} />
            <Route path="/admin/products" element={<Protected><ProductsList /></Protected>} />
            <Route path="/admin/products/:id" element={<Protected><ProductEdit /></Protected>} />
            <Route path="/admin/brands" element={<Protected><BrandsAdmin /></Protected>} />
            <Route path="/admin/categories" element={<Protected><CategoriesAdmin /></Protected>} />
            <Route path="/admin/stores" element={<Protected><StoresAdmin /></Protected>} />
            <Route path="/admin/banners" element={<Protected><BannersAdmin /></Protected>} />
            <Route path="/admin/social" element={<Protected><SocialAdmin /></Protected>} />
            <Route path="/admin/pages" element={<Protected><PagesAdmin /></Protected>} />
            <Route path="/admin/users" element={<Protected admin><UsersAdmin /></Protected>} />
            <Route path="/admin/newsletter" element={<Protected><NewsletterAdmin /></Protected>} />
            <Route path="/admin/promo" element={<Protected><PromoCodesAdmin /></Protected>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
