import { useState, createContext, useContext } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AccessibilityMenu } from "@/components/AccessibilityMenu";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Trilha from "@/pages/Trilha";
import TrilhaUnidade from "@/pages/TrilhaUnidade";
import Programas from "@/pages/Programas";
import Ferramentas from "@/pages/Ferramentas";
import Chat from "@/pages/Chat";
import Legislacao from "@/pages/Legislacao";
import QuemSomos from "@/pages/QuemSomos";
import Admin from "@/pages/Admin";
import Calendario from "@/pages/Calendario";

const AccessibilityContext = createContext<{ isOpen: boolean; toggle: () => void }>({ isOpen: false, toggle: () => {} });
export const useAccessibility = () => useContext(AccessibilityContext);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/legislacao" component={Legislacao} />
      <Route path="/trilha" component={Trilha} />
      <Route path="/trilha/:unitId" component={TrilhaUnidade} />
      <Route path="/programas" component={Programas} />
      <Route path="/programas/:code" component={Programas} />
      <Route path="/ferramentas" component={Ferramentas} />
      <Route path="/chat" component={Chat} />
      <Route path="/quem-somos" component={QuemSomos} />
      <Route path="/calendario" component={Calendario} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const toggleAccessibility = () => setAccessibilityOpen(prev => !prev);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AccessibilityContext.Provider value={{ isOpen: accessibilityOpen, toggle: toggleAccessibility }}>
          <Toaster />
          <Router />
          <AccessibilityMenu isOpen={accessibilityOpen} onToggle={toggleAccessibility} />
        </AccessibilityContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
