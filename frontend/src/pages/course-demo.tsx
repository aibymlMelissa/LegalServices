import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { useDemo } from '../hooks/useDemo';
import AICourseDemo from '../components/AICourseDemo';

export default function CourseDemoPage() {
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

  return <AICourseDemo />;
}