-- Function to calculate rank based on points
CREATE OR REPLACE FUNCTION public.get_rank_title(points integer)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN CASE
    WHEN points >= 5000 THEN 'Elite Hunter'
    WHEN points >= 2000 THEN 'Master Hunter'
    WHEN points >= 1000 THEN 'Expert Hunter'
    WHEN points >= 500 THEN 'Senior Hunter'
    WHEN points >= 200 THEN 'Hunter'
    WHEN points >= 50 THEN 'Apprentice'
    ELSE 'Novato'
  END;
END;
$$;

-- Function to update pentester stats when report is accepted
CREATE OR REPLACE FUNCTION public.update_pentester_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  points_to_add integer;
  new_total_points integer;
  reward numeric;
BEGIN
  -- Only process when status changes to 'accepted' or 'paid'
  IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status IN ('accepted', 'paid')) THEN
    -- Skip if already processed for accepted (avoid double counting)
    IF OLD.status = 'accepted' AND NEW.status = 'paid' THEN
      -- Just update earnings when paid
      IF NEW.reward_amount IS NOT NULL AND NEW.reward_amount > 0 THEN
        UPDATE profiles
        SET total_earnings = total_earnings + NEW.reward_amount,
            updated_at = now()
        WHERE id = NEW.pentester_id;
      END IF;
      RETURN NEW;
    END IF;
    
    -- Calculate points based on severity
    points_to_add := CASE NEW.severity
      WHEN 'low' THEN 10
      WHEN 'medium' THEN 25
      WHEN 'high' THEN 50
      WHEN 'critical' THEN 100
      ELSE 0
    END;
    
    -- Update pentester profile
    UPDATE profiles
    SET 
      total_points = total_points + points_to_add,
      vulnerabilities_found = vulnerabilities_found + 1,
      rank_title = public.get_rank_title(total_points + points_to_add),
      updated_at = now()
    WHERE id = NEW.pentester_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on reports table
DROP TRIGGER IF EXISTS on_report_status_change ON reports;
CREATE TRIGGER on_report_status_change
  AFTER UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pentester_stats();