"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import Image from "next/image";
import UserInfoCard from "@/components/profile/UserInfoCard";
import SettingsCard from "@/components/profile/SettingsCard";
import Pulse3DHero from "@/components/profile/Pulse3DHero";

export default function ProfilePage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-blue-600 text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <section className="healthai-container" style={{ maxWidth: 900 }}>
        <div className="text-center mb-8">
          <img 
            src="/health-ai-logo.png" 
            alt="Health AI Logo" 
            width={80} 
            height={80} 
            className="healthai-logo" 
            style={{
              borderRadius: '50%',
              background: 'transparent'
            }}
          />
          <h1 className="healthai-title" style={{ fontSize: "2rem" }}>Your Health Dashboard</h1>
        </div>

        <div className="space-y-6">
          <Pulse3DHero />
          <UserInfoCard email={user.email || ""} />
          <SettingsCard onSignOut={handleSignOut} />
        </div>
      </section>
    </div>
  );
} 