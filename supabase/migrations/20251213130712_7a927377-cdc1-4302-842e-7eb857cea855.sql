-- Função para obter evolução de vulnerabilidades por mês de um hunter
CREATE OR REPLACE FUNCTION public.get_hunter_monthly_stats(hunter_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(monthly_data ORDER BY month)
  INTO result
  FROM (
    SELECT 
      TO_CHAR(DATE_TRUNC('month', r.created_at), 'YYYY-MM') as month,
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE r.severity = 'critical') as critical,
      COUNT(*) FILTER (WHERE r.severity = 'high') as high,
      COUNT(*) FILTER (WHERE r.severity = 'medium') as medium,
      COUNT(*) FILTER (WHERE r.severity = 'low') as low
    FROM reports r
    WHERE r.pentester_id = hunter_id
    GROUP BY DATE_TRUNC('month', r.created_at)
    ORDER BY DATE_TRUNC('month', r.created_at) DESC
    LIMIT 12
  ) as monthly_data;

  RETURN COALESCE(result, '[]'::json);
END;
$$;