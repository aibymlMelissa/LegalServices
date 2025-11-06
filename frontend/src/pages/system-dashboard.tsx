import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import SystemDashboard from '../components/SystemDashboard';

export default function SystemDashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { isDemoMode } = useDemo();

  useEffect(() => {
    if (!isAuthenticated && !isDemoMode) {
      router.push('/login');
    }
  }, [isAuthenticated, isDemoMode, router]);

  if (!isAuthenticated && !isDemoMode) {
    return null;
  }

  return <SystemDashboard />;
}