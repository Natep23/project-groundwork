import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartScreen from "./screens/StartScreen";
import DashboardScreen from "./screens/DashboardScreen";
import CreateCardScreen from "./screens/CreateCardScreen";
import CardScreen from "./screens/CardScreen";
import { Header } from "./components/header";
import ScrollToTop from "./components/ScrollToTop";
import { EngagementCelebrations } from "./components/EngagementCelebrations";
import { BootSequence } from "./components/BootSequence";
import { ThemedEngagementVisuals } from "./lib/engagementTheme";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { useDailyVisit } from "./lib/useDailyVisit";
import { ErrorBoundary } from "./components/ErrorBoundary";

/* Runs the daily-visit ping + the once-per-app celebration watcher. Lives
 * inside <Authenticated> so it never runs signed-out, and outside any
 * screen so it survives navigation between CardScreen/CreateCardScreen
 * (where most XP is actually awarded). */
function EngagementRoot() {
  useDailyVisit();
  return <EngagementCelebrations />;
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Header />
            <AuthLoading>
              <BootSequence statusLabel="Checking credentials…" />
            </AuthLoading>
            <Unauthenticated>
              <StartScreen />
            </Unauthenticated>
            <Authenticated>
              <ThemedEngagementVisuals>
                <EngagementRoot />
              </ThemedEngagementVisuals>
              <Routes>
                <Route path="/" element={<DashboardScreen />} />
                <Route path="/create-card" element={<CreateCardScreen />} />
                <Route path="/card/:id" element={<CardScreen />} />
                <Route path="*" element={<DashboardScreen />} />
              </Routes>
            </Authenticated>
          </BrowserRouter>
        </ToastProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
