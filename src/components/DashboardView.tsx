import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  ClipboardCheck,
  Database,
  FolderKanban,
  Globe,
  Lock,
  LogIn,
} from 'lucide-react';
import type {
  AnimationClass,
  PublishedWork,
  StaffInvite,
  StudentGroup,
  StudentRecord,
  Submission,
  UserAccount,
  WorkCategory,
} from '../types';
import { computeDashboardStats } from '../utils/validation';
import { AdminAccessBackupPanel } from './dashboard/AdminAccessBackupPanel';
import { MasterDataPanel } from './dashboard/MasterDataPanel';
import { PublicationsPanel } from './dashboard/PublicationsPanel';
import { StatsPanel } from './dashboard/StatsPanel';
import { SubmissionsPanel } from './dashboard/SubmissionsPanel';

interface DashboardViewProps {
  userProfile: UserAccount | null;
  authLoading: boolean;
  onSignIn: () => void;
  submissions: Submission[];
  publishedWorks: PublishedWork[];
  classes: AnimationClass[];
  categories: WorkCategory[];
  groups: StudentGroup[];
  students: StudentRecord[];
  staffInvites: StaffInvite[];
  users: UserAccount[];
  onNotify: (msg: string) => void;
}

type DashboardTab = 'stats' | 'submissions' | 'publications' | 'master' | 'access';

export const DashboardView: React.FC<DashboardViewProps> = ({
  userProfile,
  authLoading,
  onSignIn,
  submissions,
  publishedWorks,
  classes,
  categories,
  groups,
  students,
  staffInvites,
  users,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('stats');

  const stats = useMemo(
    () =>
      computeDashboardStats({
        students,
        groups,
        submissions,
        publishedWorks,
      }),
    [students, groups, submissions, publishedWorks]
  );

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Memeriksa sesi autentikasi...
      </div>
    );
  }

  // Require authenticated GURU or ADMIN
  if (!userProfile || (userProfile.role !== 'ADMIN' && userProfile.role !== 'GURU')) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-14">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Portal Dashboard Guru &amp; Admin
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              Data tugas, file mentah proyek siswa, dan panel penilaian dilindungi oleh autentikasi Google terverifikasi.
            </p>
          </div>

          {userProfile && userProfile.role === 'SISWA' ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-relaxed">
              Akun Anda ({userProfile.email}) saat ini memiliki peran <strong>SISWA</strong>. Hubungi Admin jurusan apabila Anda adalah guru pembimbing yang memerlukan akses peninjauan tugas.
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-700 text-white text-sm font-semibold hover:bg-indigo-800 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Masuk dengan Akun Google Guru / Admin
            </button>
          )}
        </div>
      </div>
    );
  }

  const sidebarItems: Array<{ id: DashboardTab; label: string; icon: React.ReactNode }> = [
    { id: 'stats', label: 'Statistik', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'submissions',
      label: `Tugas Masuk (${submissions.length})`,
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
    {
      id: 'publications',
      label: `Publikasi (${publishedWorks.length})`,
      icon: <Globe className="w-4 h-4" />,
    },
    { id: 'master', label: 'Master Data', icon: <FolderKanban className="w-4 h-4" /> },
    { id: 'access', label: 'Akses & Backup', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-64 shrink-0 space-y-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-3">
            <p className="text-xs font-semibold text-indigo-700">{userProfile.role}</p>
            <p className="font-display text-base font-bold text-slate-900 truncate mt-0.5">
              {userProfile.displayName}
            </p>
            <p className="text-xs text-slate-500 truncate">{userProfile.email}</p>
          </div>

          <nav
            aria-label="Menu dashboard guru dan admin"
            className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0"
          >
            {sidebarItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-indigo-700 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Workspace Viewport */}
        <div className="flex-1 min-w-0">
          {activeTab === 'stats' && <StatsPanel stats={stats} />}
          {activeTab === 'submissions' && (
            <SubmissionsPanel
              submissions={submissions}
              classes={classes}
              categories={categories}
              onNotify={onNotify}
            />
          )}
          {activeTab === 'publications' && (
            <PublicationsPanel works={publishedWorks} onNotify={onNotify} />
          )}
          {activeTab === 'master' && (
            <MasterDataPanel
              students={students}
              groups={groups}
              classes={classes}
              categories={categories}
              onNotify={onNotify}
            />
          )}
          {activeTab === 'access' && (
            <AdminAccessBackupPanel
              currentUser={userProfile}
              staffInvites={staffInvites}
              users={users}
              submissions={submissions}
              onNotify={onNotify}
            />
          )}
        </div>
      </div>
    </div>
  );
};
