"use client";

import { Box } from "@mui/material";
import { Suspense } from "react";

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