"use client";

import { Box } from "@mui/material";
import { Suspense } from "react";
import UserInfoCard from "@/components/profile/UserInfoCard";
import { useUser } from "@/utils/supabaseClient";

export default function HealthToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();

  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff", display: 'flex', flexDirection: 'row' }}>
      {/* Sidebar for logged-in users */}
      {!loading && user && (
        <Box sx={{ width: 280, p: 2, borderRight: '1px solid #e0e0e0', background: '#fff', minHeight: '100vh' }}>
          <UserInfoCard email={user.email || ''} />
        </Box>
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