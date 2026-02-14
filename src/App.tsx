import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import DeliveryMetrics from "./pages/DeliveryMetrics";
import AITools from "./pages/AITools";
import Teams from "./pages/Teams";
import People from "./pages/People";
import Insights from "./pages/Insights";
import Proficiency from "./pages/Proficiency";
import Marketplace from "./pages/Marketplace";
import MyArea from "./pages/MyArea";
import Integrations from "./pages/Integrations";
import Help from "./pages/Help";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/metrics/delivery" element={<DeliveryMetrics />} />
            <Route path="/metrics/ai-tools" element={<AITools />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/people" element={<People />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/proficiency" element={<Proficiency />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/me" element={<MyArea />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/help" element={<Help />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
