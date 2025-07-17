"use client";

import { Box } from "@mui/material";
import { Suspense, useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import { useUser } from "@/utils/supabaseClient";
import { usePathname, useRouter } from "next/navigation";
import { getMenuItems } from "@/components/Sidebar";

export default function HealthToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [notifications] = useState(2); // Mock notifications

  // For menu highlighting
  const menuItems = getMenuItems(user || {});

  const handleSignOut = async () => {
    try {
      const { supabase } = await import("@/utils/supabaseClient");
      if (supabase) {
        await supabase.auth.signOut();
        router.push('/login');
      } else {
        console.error('Supabase client not initialized');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      router.push('/login');
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      background: "#f8f9ff", 
      display: 'flex', 
      flexDirection: 'row',
      position: 'relative'
    }}>
      {/* Sidebar and TopBar for logged-in users */}
      {!loading && user && (
        <>
          <TopBar
            user={user}
            notifications={notifications}
            menuItems={menuItems}
            onSignOut={handleSignOut}
            onNavigate={handleNavigate}
            pathname={pathname}
          />
          <Sidebar user={user} pathname={pathname} />
        </>
      )}
      {/* Main content */}
      <Box sx={{ 
        flex: 1, 
        minWidth: 0,
        marginTop: user ? { xs: '64px', md: '64px' } : 0, // Only add margin for logged-in users
        marginLeft: user ? { xs: 0, md: '280px' } : 0, // Only add margin for logged-in users
        padding: { xs: 2, md: 3 },
        boxSizing: 'border-box',
        width: user ? { xs: '100%', md: 'calc(100% - 280px)' } : '100%', // Full width for logged-out users
        minHeight: user ? { xs: 'calc(100vh - 64px)', md: 'calc(100vh - 64px)' } : '100vh' // Full height for logged-out users
      }}>
        <Suspense fallback={<div />}>
          {children}
        </Suspense>
      </Box>
    </Box>
  );
} 