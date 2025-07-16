"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Box } from "@mui/material";
import DashboardLayout from "../dashboard/layout";
import { supabase } from "@/utils/supabaseClient";

interface HealthToolsLayoutProps {
  children: React.ReactNode;
}

export default function HealthToolsLayout({ children }: HealthToolsLayoutProps) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromDashboard = searchParams.get('from') === 'dashboard';

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  // If user is logged in and coming from dashboard, show dashboard layout
  if (user && fromDashboard) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  // If loading, show loading state
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0066CC 0%, #004499 50%, #000000 100%)'
      }}>
        <Box sx={{ textAlign: 'center', color: 'white' }}>
          <img 
            src="/health-ai-logo.png" 
            alt="Health AI Logo" 
            width={80} 
            height={80} 
            style={{
              borderRadius: '50%',
              background: 'transparent',
              display: 'block',
              margin: '0 auto 20px'
            }}
          />
          <Box sx={{ fontSize: '1.2rem', fontWeight: 500 }}>
            Loading Health Tools...
          </Box>
        </Box>
      </Box>
    );
  }

  // If not logged in or not from dashboard, show standalone layout
  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      {children}
    </Box>
  );
} 