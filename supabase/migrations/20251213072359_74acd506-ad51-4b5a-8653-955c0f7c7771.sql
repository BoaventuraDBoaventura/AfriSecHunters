-- Update the handle_new_user function to also set role from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public 
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role, company_name)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data->>'display_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'pentester'::user_role),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'company' 
      THEN NEW.raw_user_meta_data->>'display_name'
      ELSE NULL
    END
  );
  RETURN NEW;
END;
$$;