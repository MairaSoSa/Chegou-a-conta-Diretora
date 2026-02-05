import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Trilha from "@/pages/Trilha";
import Programas from "@/pages/Programas";
import Ferramentas from "@/pages/Ferramentas";
import Chat from "@/pages/Chat";
import QuemSomos from "@/pages/QuemSomos";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/trilha" component={Trilha} />
      <Route path="/programas" component={Programas} />
      {/* Dynamic route for program details if we had the component ready, handled generically for now or added later */}
      <Route path="/programas/:code" component={Programas} /> 
      <Route path="/ferramentas" component={Ferramentas} />
      <Route path="/chat" component={Chat} />
      <Route path="/quem-somos" component={QuemSomos} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
