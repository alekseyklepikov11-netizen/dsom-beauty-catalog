import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useFavorites = () => {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("favorites").select("product_id").eq("user_id", user.id);
    setIds(new Set((data || []).map((r: any) => r.product_id)));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(
    async (productId: string) => {
      if (!user) return false;
      const has = ids.has(productId);
      const next = new Set(ids);
      if (has) {
        next.delete(productId);
        setIds(next);
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
      } else {
        next.add(productId);
        setIds(next);
        await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
      }
      return !has;
    },
    [ids, user]
  );

  return { ids, loading, toggle, isFavorite: (id: string) => ids.has(id), refresh, isAuthenticated: !!user };
};
