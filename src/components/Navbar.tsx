import React, { useState } from 'react';
import { LogIn, LogOut, Menu, X } from 'lucide-react';
import type { UserAccount } from '../types';

export type AppView = 'gallery' | 'submit' | 'status' | 'dashboard';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  userProfile: UserAccount | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onNavigate,
  userProfile,
  authLoading,
  onSignIn,
  onSignOut,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: AppView; label: string }> = [
    { id: 'gallery', label: 'Galeri Karya' },
    { id: 'submit', label: 'Kirim Tugas' },
    { id: 'status', label: 'Cek Status' },
    { id: 'dashboard', label: 'Dashboard' },
  ];

  const handleSelect = (view: AppView) => {
    onNavigate(view);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelect('gallery')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 hover:text-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          SMK Animasi
        </button>

        {/* Zone 2: 4 Single-line Nav Links */}
        <nav aria-label="Navigasi utama" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-indigo-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-indigo-700" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {authLoading ? (
            <span className="text-xs text-slate-500 whitespace-nowrap">Memuat akun...</span>
          ) : userProfile ? (
            <button
              type="button"
              onClick={onSignOut}
              title={`Keluar dari ${userProfile.email}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 text-xs font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="max-w-[140px] truncate">{userProfile.displayName}</span>
              <span className="text-indigo-700">{userProfile.role}</span>
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              Masuk Guru
            </button>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileMenuOpen}
          className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            {userProfile ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignOut();
                }}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-800"
              >
                <span className="truncate">
                  {userProfile.displayName} ({userProfile.role})
                </span>
                <LogOut className="w-4 h-4 text-slate-500 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSignIn();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-700 text-white text-sm font-semibold"
              >
                <LogIn className="w-4 h-4" />
                Masuk Guru / Admin
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
