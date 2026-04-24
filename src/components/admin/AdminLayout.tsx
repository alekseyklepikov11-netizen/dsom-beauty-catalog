import { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Tag, Building2, Store, Image as ImageIcon,
  Share2, FileText, Users, LogOut, ExternalLink, Mail, Ticket, MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem { to: string; label: string; icon: any; adminOnly?: boolean }
const NAV: NavItem[] = [
  { to: "/admin", label: "Обзор", icon: LayoutDashboard },
  { to: "/admin/products", label: "Товары", icon: Package },
  { to: "/admin/categories", label: "Категории", icon: Tag },
  { to: "/admin/brands", label: "Бренды", icon: Building2 },
  { to: "/admin/stores", label: "Магазины", icon: Store },
  { to: "/admin/banners", label: "Баннеры", icon: ImageIcon },
  { to: "/admin/reviews", label: "Отзывы", icon: MessageSquare },
  { to: "/admin/social", label: "Соцсети", icon: Share2 },
  { to: "/admin/pages", label: "Страницы", icon: FileText },
  { to: "/admin/promo", label: "Промокоды", icon: Ticket },
  { to: "/admin/newsletter", label: "Рассылка", icon: Mail },
  { to: "/admin/users", label: "Пользователи", icon: Users, adminOnly: true },
];

const AdminLayout = ({ children }: { children: ReactNode }) => {
  const { signOut, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-foreground text-background sticky top-0 h-screen">
        <div className="p-7 border-b border-background/10">
          <Link to="/admin" className="font-display text-xl tracking-[0.4em]">DSOM</Link>
          <p className="text-[10px] tracking-luxe uppercase text-background/40 mt-1">Admin</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
            const active = pathname === n.to || (n.to !== "/admin" && pathname.startsWith(n.to));
            const Icon = n.icon;
            return (
              <NavLink
                key={n.to} to={n.to} end={n.to === "/admin"}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-[11px] tracking-luxe uppercase transition-colors ${
                  active ? "bg-background/10 text-background" : "text-background/60 hover:text-background hover:bg-background/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-background/10 space-y-1">
          <a
            href="/" target="_blank" rel="noreferrer"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-[11px] tracking-luxe uppercase text-background/60 hover:text-background hover:bg-background/5"
          >
            <ExternalLink className="w-3.5 h-3.5" />Открыть сайт
          </a>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-md text-[11px] tracking-luxe uppercase text-background/60 hover:text-background hover:bg-background/5"
          >
            <LogOut className="w-3.5 h-3.5" />Выйти
          </button>
          {user && <p className="px-4 pt-2 text-[10px] text-background/30 truncate">{user.email}</p>}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-foreground text-background px-5 py-3 flex items-center justify-between">
        <Link to="/admin" className="font-display tracking-[0.3em]">DSOM · Admin</Link>
        <button onClick={handleSignOut} className="text-[10px] tracking-luxe uppercase">Выйти</button>
      </div>

      <main className="flex-1 lg:ml-0 pt-14 lg:pt-0 min-w-0">
        <div className="p-6 md:p-10 max-w-6xl">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;
