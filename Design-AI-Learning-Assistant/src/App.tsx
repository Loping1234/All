import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedBackground } from "./components/AnimatedBackground";
import { FloatingNav } from "./components/FloatingNav";
import { HomePage } from "./components/HomePage";
import { AuthPage } from "./components/AuthPage";
import { Dashboard } from "./components/Dashboard";
import { ProfilePage } from "./components/ProfilePage";
import { AuthDebugger } from "./components/AuthDebugger";
import { RateLimitIndicator } from "./components/RateLimitIndicator";
import { supabase } from "./lib/supabase";
import { User } from "@supabase/supabase-js";
import { Toaster } from "./components/ui/sonner";
import { Loader2 } from "lucide-react";

type Page = "home" | "auth" | "dashboard" | "profile";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentPage("dashboard");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setCurrentPage("dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page: string) => {
    // If logging out, sign out from Supabase
    if (page === "home" && currentPage === "dashboard") {
      handleLogout();
      return;
    }
    setCurrentPage(page as Page);
  };

  const handleAuthSuccess = () => {
    window.location.href = "http://localhost:5000/";
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentPage("home");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AnimatedBackground />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      <Toaster position="top-right" />
      <AuthDebugger />
      <RateLimitIndicator />

      {/* Navigation */}
      {currentPage !== "auth" && (
        <FloatingNav
          currentPage={currentPage}
          onNavigate={handleNavigate}
          showDashboardItems={user !== null}
        />
      )}

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          {currentPage === "home" && <HomePage onNavigate={handleNavigate} />}
          {currentPage === "auth" && (
            <AuthPage onNavigate={handleNavigate} onAuthSuccess={handleAuthSuccess} />
          )}
          {currentPage === "dashboard" && <Dashboard />}
          {currentPage === "profile" && <ProfilePage onNavigate={handleNavigate} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
