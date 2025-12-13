-- Create enum types
CREATE TYPE user_role AS ENUM ('pentester', 'company', 'admin');
CREATE TYPE report_status AS ENUM ('pending', 'in_review', 'accepted', 'rejected', 'paid');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE vulnerability_type AS ENUM ('xss', 'sql_injection', 'idor', 'ssrf', 'auth_bypass', 'rce', 'other');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'pentester',
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  company_name TEXT,
  company_logo TEXT,
  company_website TEXT,
  skills TEXT[],
  total_earnings DECIMAL(12,2) DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  vulnerabilities_found INTEGER DEFAULT 0,
  rank_title TEXT DEFAULT 'Novato',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Programs table
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scope TEXT[],
  out_of_scope TEXT[],
  rules TEXT,
  reward_low DECIMAL(10,2) DEFAULT 100,
  reward_medium DECIMAL(10,2) DEFAULT 500,
  reward_high DECIMAL(10,2) DEFAULT 2000,
  reward_critical DECIMAL(10,2) DEFAULT 5000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE NOT NULL,
  pentester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  vulnerability_type vulnerability_type NOT NULL,
  severity severity_level NOT NULL,
  description TEXT NOT NULL,
  steps_to_reproduce TEXT,
  impact TEXT,
  recommendation TEXT,
  proof_of_concept TEXT,
  status report_status DEFAULT 'pending',
  reward_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Programs policies
CREATE POLICY "Active programs are viewable by everyone" ON public.programs FOR SELECT USING (is_active = true OR company_id = auth.uid());
CREATE POLICY "Companies can create programs" ON public.programs FOR INSERT WITH CHECK (auth.uid() = company_id);
CREATE POLICY "Companies can update own programs" ON public.programs FOR UPDATE USING (auth.uid() = company_id);
CREATE POLICY "Companies can delete own programs" ON public.programs FOR DELETE USING (auth.uid() = company_id);

-- Reports policies
CREATE POLICY "Pentesters can view own reports" ON public.reports FOR SELECT USING (
  pentester_id = auth.uid() OR 
  program_id IN (SELECT prog.id FROM public.programs prog WHERE prog.company_id = auth.uid())
);
CREATE POLICY "Pentesters can create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = pentester_id);
CREATE POLICY "Companies can update reports on their programs" ON public.reports FOR UPDATE USING (
  program_id IN (SELECT prog.id FROM public.programs prog WHERE prog.company_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view messages on their reports" ON public.messages FOR SELECT USING (
  report_id IN (SELECT rep.id FROM public.reports rep WHERE rep.pentester_id = auth.uid()) OR
  report_id IN (SELECT rep.id FROM public.reports rep JOIN public.programs prog ON rep.program_id = prog.id WHERE prog.company_id = auth.uid())
);
CREATE POLICY "Users can send messages on their reports" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();