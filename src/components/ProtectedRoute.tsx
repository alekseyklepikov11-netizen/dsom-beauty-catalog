import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  children: ReactNode;
  /** required role; admin OR editor satisfies "editor" requirement */
  require?: "user" | "editor" | "admin";
}

const ProtectedRoute = ({ children, require = "editor" }: Props) => {
  const { user, isAdmin, isEditor, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center text-[11px] tracking-luxe uppercase text-muted-foreground">
        …
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  const ok =
    require === "user" ? true :
    require === "editor" ? isEditor :
    isAdmin;

  if (!ok) {
    return (
      <div className="min-h-screen grid place-items-center px-6 text-center">
        <div>
          <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">403</p>
          <h1 className="font-display text-4xl mb-3">Доступ ограничен</h1>
          <p className="text-sm text-muted-foreground">У вашего аккаунта нет прав для этого раздела.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
