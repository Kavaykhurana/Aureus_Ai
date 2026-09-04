import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AuditTrail from "./pages/AuditTrail";
import CoreWatchlist from "./pages/CoreWatchlist";
import EarningsRadar from "./pages/EarningsRadar";
import Exceptions from "./pages/Exceptions";
import Home from "./pages/Home";
import AnalysisHistory from "./pages/AnalysisHistory";
import NotFound from "./pages/NotFound";
import PolicyCenter from "./pages/PolicyCenter";
import Portfolio from "./pages/Portfolio";
import RiskMatrix from "./pages/RiskMatrix";
import StockDetail from "./pages/StockDetail";
import { Route, Switch } from "wouter";

function Router() {
  return <Switch>
    <Route path="/" component={Home} />
    <Route path="/portfolio" component={Portfolio} />
    <Route path="/risk" component={RiskMatrix} />
    <Route path="/audit" component={AuditTrail} />
    <Route path="/history" component={AnalysisHistory} />
    <Route path="/policies" component={PolicyCenter} />
    <Route path="/stock/:ticker" component={StockDetail} />
    <Route path="/watchlist" component={CoreWatchlist} />
    <Route path="/earnings" component={EarningsRadar} />
    <Route path="/exceptions" component={Exceptions} />
    <Route path="/404" component={NotFound} />
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
