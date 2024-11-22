import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import { SolanaWalletProvider } from "./integrations/wallet/WalletProvider";
import { ErrorBoundary } from "react-error-boundary";
import { FallbackComponent } from "./FallbackComponent";

const queryClient = new QueryClient();

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <QueryClientProvider client={queryClient}>
        <SolanaWalletProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SolanaWalletProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
