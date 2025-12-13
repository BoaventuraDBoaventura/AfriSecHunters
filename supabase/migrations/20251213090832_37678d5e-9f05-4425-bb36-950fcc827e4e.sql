-- Function to update hunter stats when a report is paid
CREATE OR REPLACE FUNCTION public.update_hunter_stats_on_paid()
RETURNS TRIGGER AS $$
DECLARE
  points_earned INTEGER;
BEGIN
  -- Only trigger when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- Calculate points based on severity
    CASE NEW.severity
      WHEN 'critical' THEN points_earned := 100;
      WHEN 'high' THEN points_earned := 50;
      WHEN 'medium' THEN points_earned := 25;
      WHEN 'low' THEN points_earned := 10;
      ELSE points_earned := 5;
    END CASE;

    -- Update the hunter's profile
    UPDATE public.profiles
    SET 
      total_earnings = COALESCE(total_earnings, 0) + COALESCE(NEW.reward_amount, 0),
      total_points = COALESCE(total_points, 0) + points_earned,
      vulnerabilities_found = COALESCE(vulnerabilities_found, 0) + 1,
      rank_title = get_rank_title(COALESCE(total_points, 0) + points_earned),
      updated_at = now()
    WHERE id = NEW.pentester_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for report status changes
DROP TRIGGER IF EXISTS on_report_paid ON public.reports;
CREATE TRIGGER on_report_paid
  AFTER UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hunter_stats_on_paid();

-- Also update existing paid reports that haven't been counted yet
DO $$
DECLARE
  r RECORD;
  points_earned INTEGER;
BEGIN
  FOR r IN SELECT pentester_id, severity, reward_amount FROM reports WHERE status = 'paid'
  LOOP
    CASE r.severity
      WHEN 'critical' THEN points_earned := 100;
      WHEN 'high' THEN points_earned := 50;
      WHEN 'medium' THEN points_earned := 25;
      WHEN 'low' THEN points_earned := 10;
      ELSE points_earned := 5;
    END CASE;

    UPDATE public.profiles
    SET 
      total_earnings = COALESCE(total_earnings, 0) + COALESCE(r.reward_amount, 0),
      total_points = COALESCE(total_points, 0) + points_earned,
      vulnerabilities_found = COALESCE(vulnerabilities_found, 0) + 1,
      updated_at = now()
    WHERE id = r.pentester_id;
  END LOOP;
  
  -- Update rank titles for all hunters
  UPDATE public.profiles
  SET rank_title = get_rank_title(COALESCE(total_points, 0))
  WHERE role = 'pentester';
END;
$$;