import { UserCircle } from 'lucide-react';

interface UserInfoCardProps {
  email: string;
}

export default function UserInfoCard({ email }: UserInfoCardProps) {
  return (
    <div 
      className="flex items-center gap-4 bg-white/90 dark:bg-gray-900/90 rounded-2xl shadow-lg p-6 mb-4"
    >
      <UserCircle className="text-blue-600" size={48} aria-label="User avatar" />
      <div>
        <div className="font-heading font-bold text-lg text-blue-600">User</div>
        <div className="font-body text-gray-700 dark:text-gray-300 text-sm">{email}</div>
      </div>
    </div>
  );
} 