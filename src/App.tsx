import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import StartScreen from "./screens/StartScreen";
import DashboardScreen from "./screens/DashboardScreen";
import CreateCardScreen from "./screens/CreateCardScreen";
import CardScreen from "./screens/CardScreen";
import { Header } from "./components/header";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./lib/theme";
import { ToastProvider } from "./lib/toast";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <ToastProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Header />
            <AuthLoading>
              <div className="app-loading" role="status">
                <span>Checking credentials…</span>
              </div>
            </AuthLoading>
            <Unauthenticated>
              <StartScreen />
            </Unauthenticated>
            <Authenticated>
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
