import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { BarChart3, ArrowLeft, FileDown } from 'lucide-react';
import '../../module1.css';

export default function ReportLayout() {
  const location = useLocation();
  const pathname = location.pathname;
  const items = [
    { href: '/modules/module1/report/7', label: '7 — PRL' },
    { href: '/modules/module1/report/8', label: '8 — EE' },
    { href: '/modules/module1/report/9', label: '9 — IPLE' },
    { href: '/modules/module1/report/10', label: '10 — Breakdown' },
    { href: '/modules/module1/report/11', label: '11 — Threshold' },
    { href: '/modules/module1/report/12', label: '12 — 3-year plan' },
    { href: '/modules/module1/report/13', label: '13 — Dashboard' },
  ];

  return (
    <div className="module1-wrapper min-h-screen bg-gradient-cfo text-cfo-text">
      {/* Header */}
      <div className="border-b border-cfo-border bg-cfo-card/60 backdrop-blur">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-cfo-accent">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Financial & Analytics Report</h1>
              <p className="text-xs text-cfo-muted">Interactive reporting — sections 7 → 13</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/modules/module1" className="form-button form-button-secondary inline-flex items-center space-x-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </Link>
            <button className="form-button form-button-primary inline-flex items-center space-x-2" onClick={() => window.print()}>
              <FileDown className="w-4 h-4" />
              <span>Exporter (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Body with side nav */}
      <div className="container mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-5 gap-6">
        <nav className="lg:col-span-1 space-y-2 sticky top-4 self-start hidden lg:block">
          {items.map((it) => (
            <Link
              key={it.href}
              to={it.href}
              className={`block px-3 py-2 rounded-md border text-sm ${pathname === it.href ? 'bg-cfo-accent/10 border-cfo-accent text-white' : 'bg-gray-900/40 border-gray-700 hover:border-cfo-accent'}`}
            >
              {it.label}
            </Link>
          ))}
        </nav>
        <main className="lg:col-span-4 space-y-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
