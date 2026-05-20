-- RPC для безопасной проверки существует ли юзер с email + подтверждён ли.
-- SECURITY DEFINER — функция запускается от postgres, проверяет auth.users.
-- Возвращает только factbool — НЕ раскрывает id, имя или другие поля.

CREATE OR REPLACE FUNCTION public.check_user_email(p_email TEXT)
RETURNS TABLE(user_exists BOOLEAN, is_confirmed BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    TRUE AS user_exists,
    (u.email_confirmed_at IS NOT NULL) AS is_confirmed
  FROM auth.users u
  WHERE LOWER(u.email) = LOWER(TRIM(p_email))
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE AS user_exists, FALSE AS is_confirmed;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.check_user_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_user_email(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.check_user_email(TEXT)
  IS 'Pre-flight check before signup. Returns user_exists + is_confirmed without exposing identity.';
