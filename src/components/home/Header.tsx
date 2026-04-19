'use client';

import { useState, useEffect } from 'react';
import { Home, Settings } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          setIsAdmin(data.isAdmin === true);
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-title">
        <div className="h3">Milestone calculator</div>
      </div>
      <div className="topbar-actions">
        <a
          href="https://xzibit-apps.vercel.app"
          className="btn btn--ghost"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>Apps home</span>
        </a>
        {isAdmin && (
          <Link href="/admin" className="btn btn--secondary">
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span>Admin</span>
          </Link>
        )}
      </div>
    </div>
  );
}
