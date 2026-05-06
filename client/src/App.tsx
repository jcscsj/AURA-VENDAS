import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ShopProvider } from "./contexts/ShopContext";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import EditProfile from "./pages/EditProfile";
import AdminSetup from "./pages/AdminSetup";
import AdminPasswordReset from "./pages/AdminPasswordReset";
import AdminLogin from "./pages/AdminLogin";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/register"} component={Register} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/orders"} component={Orders} />
      <Route path={"/edit-profile"} component={EditProfile} />
      <Route path={"/admin"} component={Admin} />
      <Route path={"/admin-login"} component={AdminLogin} />
      <Route path={"/admin-setup"} component={AdminSetup} />
      <Route path={"/admin-password-reset"} component={AdminPasswordReset} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <ShopProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ShopProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
