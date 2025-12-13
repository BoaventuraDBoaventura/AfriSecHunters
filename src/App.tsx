import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { NotificationProvider } from "@/components/NotificationProvider";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Programs from "./pages/Programs";
import ProgramDetail from "./pages/ProgramDetail";
import Dashboard from "./pages/Dashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import CreateProgram from "./pages/CreateProgram";
import EditProgram from "./pages/EditProgram";
import Leaderboard from "./pages/Leaderboard";
import PublicProfile from "./pages/PublicProfile";
import SubmitReport from "./pages/SubmitReport";
import ReportDetail from "./pages/ReportDetail";
import EditProfile from "./pages/EditProfile";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/create" element={<CreateProgram />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/programs/:id/edit" element={<EditProgram />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/company-dashboard" element={<CompanyDashboard />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/hunters/:id" element={<PublicProfile />} />
              <Route path="/submit-report/:programId" element={<SubmitReport />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
              <Route path="/profile" element={<EditProfile />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </NotificationProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
