import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function buildBreadcrumb(pathname) {
  const map = { dashboard: 'Dashboard', assets: 'Assets' };
  const parts = pathname.split('/').filter(Boolean);
  return parts.map((p) => map[p] || p.charAt(0).toUpperCase() + p.slice(1));
}

export default function Layout({ darkMode, setDarkMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const crumbs = buildBreadcrumb(location.pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <Sidebar collapsed={collapsed} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onMenuToggle={() => setCollapsed((v) => !v)}
        />

        {/* Breadcrumb */}
        <div className="px-6 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center gap-1">
          <span className="hover:text-brand-600 cursor-pointer">Home</span>
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              <span>›</span>
              <span className={i === crumbs.length - 1 ? 'text-gray-700 dark:text-gray-200 font-medium' : ''}>
                {c}
              </span>
            </span>
          ))}
        </div>

        <main className="flex-1 overflow-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
