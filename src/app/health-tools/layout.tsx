"use client";

import { Box } from "@mui/material";
import { Suspense } from "react";

// Force dynamic rendering to avoid build issues with useSearchParams
export const dynamic = 'force-dynamic';

export default function HealthToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minHeight: "100vh", background: "#f8f9ff" }}>
      <Suspense fallback={<div />}>{children}</Suspense>
    </Box>
  );
} 