'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SalesNewPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/sales'); }, [router]);
  return null;
}
