-- Função segura para obter estatísticas públicas da plataforma
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_earnings numeric;
  total_reports integer;
  total_companies integer;
BEGIN
  -- Total de earnings dos pentesters
  SELECT COALESCE(SUM(total_earnings), 0) INTO total_earnings
  FROM profiles
  WHERE role = 'pentester';

  -- Total de reports
  SELECT COUNT(*) INTO total_reports
  FROM reports;

  -- Total de empresas
  SELECT COUNT(*) INTO total_companies
  FROM profiles
  WHERE role = 'company';

  RETURN json_build_object(
    'total_earnings', total_earnings,
    'total_reports', total_reports,
    'total_companies', total_companies
  );
END;
$$;