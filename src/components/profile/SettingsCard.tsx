"use client";

import { motion } from "framer-motion";
import { Settings, LogOut, User, Bell, Shield } from "lucide-react";

interface SettingsCardProps {
  onSignOut: () => void;
}

export default function SettingsCard({ onSignOut }: SettingsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Settings className="text-blue-600" size={24} aria-label="Settings" />
        <h3 className="font-heading font-bold text-lg text-blue-600">Settings</h3>
      </div>

      <div className="space-y-4">
        <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <User className="text-gray-600" size={20} />
          <span className="font-body text-gray-700 dark:text-gray-300">Profile Settings</span>
        </button>

        <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Bell className="text-gray-600" size={20} />
          <span className="font-body text-gray-700 dark:text-gray-300">Notifications</span>
        </button>

        <button className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <Shield className="text-gray-600" size={20} />
          <span className="font-body text-gray-700 dark:text-gray-300">Privacy & Security</span>
        </button>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
          >
            <LogOut className="text-red-600" size={20} />
            <span className="font-body">Sign Out</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
} 