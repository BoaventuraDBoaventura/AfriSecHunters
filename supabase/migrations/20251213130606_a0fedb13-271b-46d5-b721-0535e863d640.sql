-- Função segura para obter estatísticas públicas de um hunter
CREATE OR REPLACE FUNCTION public.get_hunter_public_stats(hunter_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_reports integer;
  v_accepted_reports integer;
  v_critical_count integer;
  v_high_count integer;
  v_medium_count integer;
  v_low_count integer;
BEGIN
  -- Total de reports do hunter
  SELECT COUNT(*) INTO v_total_reports
  FROM reports r
  WHERE r.pentester_id = hunter_id;

  -- Reports aceitos
  SELECT COUNT(*) INTO v_accepted_reports
  FROM reports r
  WHERE r.pentester_id = hunter_id
  AND r.status IN ('accepted', 'paid');

  -- Contagem por severidade
  SELECT COUNT(*) INTO v_critical_count
  FROM reports r
  WHERE r.pentester_id = hunter_id AND r.severity = 'critical';

  SELECT COUNT(*) INTO v_high_count
  FROM reports r
  WHERE r.pentester_id = hunter_id AND r.severity = 'high';

  SELECT COUNT(*) INTO v_medium_count
  FROM reports r
  WHERE r.pentester_id = hunter_id AND r.severity = 'medium';

  SELECT COUNT(*) INTO v_low_count
  FROM reports r
  WHERE r.pentester_id = hunter_id AND r.severity = 'low';

  RETURN json_build_object(
    'total_reports', v_total_reports,
    'accepted_reports', v_accepted_reports,
    'severity_counts', json_build_object(
      'critical', v_critical_count,
      'high', v_high_count,
      'medium', v_medium_count,
      'low', v_low_count
    )
  );
END;
$$;