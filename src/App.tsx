
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SEOFooter from "./components/SEOFooter";
import Index from "./pages/Index";
import MovieDetail from "./pages/MovieDetail";
import WatchMovie from "./pages/WatchMovie";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminManage from "./pages/AdminManage";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import Sitemap from "./pages/Sitemap";
import DownloadStep1 from "./pages/DownloadStep1";
import DownloadStep2 from "./pages/DownloadStep2";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-black text-white">
            <Routes>
              <Route path="/sitemap" element={<Sitemap />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/manage" element={<AdminManage />} />
              <Route
                path="*"
                element={
                  <>
                    <Navbar onSearch={() => {}} />
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/movie/:id" element={<MovieDetail />} />
                      <Route path="/download-step1/:id" element={<DownloadStep1 />} />
                      <Route path="/download-step2/:id" element={<DownloadStep2 />} />
                      <Route path="/watch/:id" element={<WatchMovie />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    <SEOFooter />
                  </>
                }
              />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
