-- Corrigir função com nomes de variáveis distintos
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_earnings numeric;
  v_total_reports integer;
  v_total_companies integer;
BEGIN
  -- Total de earnings dos pentesters
  SELECT COALESCE(SUM(p.total_earnings), 0) INTO v_total_earnings
  FROM profiles p
  WHERE p.role = 'pentester';

  -- Total de reports
  SELECT COUNT(*) INTO v_total_reports
  FROM reports;

  -- Total de empresas
  SELECT COUNT(*) INTO v_total_companies
  FROM profiles p
  WHERE p.role = 'company';

  RETURN json_build_object(
    'total_earnings', v_total_earnings,
    'total_reports', v_total_reports,
    'total_companies', v_total_companies
  );
END;
$$;