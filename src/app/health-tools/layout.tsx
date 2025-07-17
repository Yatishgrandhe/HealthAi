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
    const { supabase } = await import("@/utils/supabaseClient");
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff", display: 'flex', flexDirection: 'row' }}>
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
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Suspense fallback={<div />}>
          {children}
        </Suspense>
      </Box>
    </Box>
  );
} 