import { useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";

type Role = "admin" | "editor" | "user";
interface Row { id: string; email: string | null; full_name: string | null; created_at: string; roles: Role[] }

const UsersAdmin = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: rolesData }] = await Promise.all([
      supabase.from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const byUser: Record<string, Role[]> = {};
    (rolesData || []).forEach((r: any) => { (byUser[r.user_id] = byUser[r.user_id] || []).push(r.role); });
    setRows((profiles || []).map((p: any) => ({ ...p, roles: byUser[p.id] || [] })) as Row[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: Role, on: boolean) => {
    if (on) {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    }
    load();
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <p className="text-[11px] tracking-luxe uppercase text-accent mb-3">— Доступ</p>
        <h1 className="font-display text-5xl">Пользователи</h1>
        <p className="text-sm text-muted-foreground mt-3">
          <Shield className="inline w-3.5 h-3.5 mr-1.5" />
          Назначайте роли admin (полный доступ) и editor (редактирование контента).
        </p>
      </div>

      <div className="bg-background rounded-2xl border border-border overflow-hidden">
        {loading ? <p className="p-8 text-center text-sm text-muted-foreground">Загрузка…</p> : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-[10px] tracking-luxe uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Пользователь</th>
                <th className="text-center px-3 py-3">Admin</th>
                <th className="text-center px-3 py-3">Editor</th>
                <th className="text-right px-5 py-3">Создан</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-5 py-3">
                    <p className="font-medium">{r.full_name || "—"}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </td>
                  <td className="text-center">
                    <input type="checkbox" checked={r.roles.includes("admin")} onChange={(e) => setRole(r.id, "admin", e.target.checked)} />
                  </td>
                  <td className="text-center">
                    <input type="checkbox" checked={r.roles.includes("editor")} onChange={(e) => setRole(r.id, "editor", e.target.checked)} />
                  </td>
                  <td className="text-right px-5 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("ru-RU")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default UsersAdmin;
