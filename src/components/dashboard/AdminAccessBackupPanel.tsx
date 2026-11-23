import React, { useState } from 'react';
import { Database, Download, ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import type { StaffInvite, Submission, UserAccount, UserRole } from '../../types';
import { syncStaffEmailsToServer } from '../../services/api';
import {
  addStaffInvite,
  deleteStaffInvite,
  exportFullBackupJson,
  seedInitialSchoolDataToFirestore,
  updateUserRole,
} from '../../services/firestoreService';

interface AdminAccessBackupPanelProps {
  currentUser: UserAccount;
  staffInvites: StaffInvite[];
  users: UserAccount[];
  submissions: Submission[];
  onNotify: (msg: string) => void;
}

export const AdminAccessBackupPanel: React.FC<AdminAccessBackupPanelProps> = ({
  currentUser,
  staffInvites,
  users,
  submissions,
  onNotify,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<'GURU' | 'ADMIN'>('GURU');
  const [busy, setBusy] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';

  const handleAddInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteName.trim()) return;
    setBusy(true);
    try {
      await addStaffInvite({
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
        addedBy: currentUser.uid,
      });
      const updatedEmails = [
        ...staffInvites.map((s) => s.email),
        inviteEmail.trim().toLowerCase(),
      ];
      await syncStaffEmailsToServer(updatedEmails);
      setInviteEmail('');
      setInviteName('');
      onNotify('Akses guru/admin berhasil ditambahkan.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menambah akses guru.');
    } finally {
      setBusy(false);
    }
  };

  const handleSeedData = async () => {
    setBusy(true);
    try {
      await seedInitialSchoolDataToFirestore();
      onNotify('Data awal kelas, kategori, kelompok, siswa, dan karya contoh berhasil disimpan ke database.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mengisi data awal.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadJsonBackup = async () => {
    setBusy(true);
    try {
      const backup = await exportFullBackupJson();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-smk-animasi-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      onNotify('File backup JSON berhasil diunduh.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal membuat backup JSON.');
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadCsvGrades = () => {
    const header = ['Kode', 'Judul Karya', 'Kelompok', 'Ketua', 'Kelas', 'Kategori', 'Status', 'Nilai'];
    const rows = submissions.map((s) => [
      s.trackingCode,
      `"${s.title.replace(/"/g, '""')}"`,
      `"${s.groupName.replace(/"/g, '""')}"`,
      `"${s.leaderName.replace(/"/g, '""')}"`,
      `"${s.className.replace(/"/g, '""')}"`,
      `"${s.category.replace(/"/g, '""')}"`,
      s.status,
      typeof s.score === 'number' ? String(s.score) : '',
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-nilai-animasi-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    onNotify('Rekap nilai CSV berhasil diunduh.');
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Hak Akses &amp; Backup Database
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Kelola peran pengguna (Admin, Guru, Siswa), sinkronkan data awal, serta ekspor backup terpusat.
        </p>
      </div>

      {/* Backup & Seed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Download className="w-5 h-5 text-indigo-700" />
            <h3 className="font-display text-base font-bold text-slate-900">
              Backup &amp; Ekspor Data
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Unduh salinan lengkap seluruh koleksi database (tugas, karya terpublikasi, siswa, kelompok, kelas, kategori) dalam format JSON atau rekap nilai CSV.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={handleDownloadJsonBackup}
              className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 disabled:opacity-60 cursor-pointer"
            >
              Unduh Backup JSON
            </button>
            <button
              type="button"
              onClick={handleDownloadCsvGrades}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Ekspor Rekap Nilai CSV
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-blue-600" />
            <h3 className="font-display text-base font-bold text-slate-900">
              Inisialisasi Data Sekolah
            </h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Isi database Firestore secara otomatis dengan 6 kelas Animasi, 6 kategori standar, daftar kelompok contoh, dan 5 karya portofolio perdana.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleSeedData}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
          >
            Isi Data Awal ke Firestore
          </button>
        </div>
      </div>

      {/* Admin-only RBAC Controls */}
      {isAdmin ? (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-700" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Undang Guru / Admin Baru
              </h3>
            </div>
            <form
              onSubmit={handleAddInvite}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Google
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="guru@sekolah.sch.id"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nama guru pembimbing"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Level Akses
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'GURU' | 'ADMIN')}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  <option value="GURU">GURU</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 cursor-pointer h-[38px]"
              >
                Berikan Akses
              </button>
            </form>

            {staffInvites.length > 0 && (
              <div className="pt-3 border-t border-slate-100 divide-y divide-slate-100">
                {staffInvites.map((inv) => (
                  <div
                    key={inv.id}
                    className="py-2.5 flex items-center justify-between gap-4 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{inv.fullName}</span>{' '}
                      <span className="text-xs text-slate-500">({inv.email})</span>
                      <span className="ml-2 text-xs font-bold text-indigo-700">{inv.role}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        deleteStaffInvite(inv.id)
                          .then(() => onNotify(`Undangan ${inv.email} dicabut.`))
                          .catch((err) => onNotify(err.message))
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <h3 className="font-display text-base font-bold text-slate-900">
                Daftar Pengguna Terdaftar
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {users.map((u) => (
                <div
                  key={u.uid}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{u.displayName}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <select
                    value={u.role}
                    aria-label={`Ubah peran ${u.displayName}`}
                    onChange={(e) =>
                      updateUserRole(u.uid, e.target.value as UserRole)
                        .then(() => onNotify(`Peran ${u.displayName} diubah.`))
                        .catch((err) => onNotify(err.message))
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="GURU">GURU</option>
                    <option value="SISWA">SISWA</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-sm text-slate-600">
          Anda masuk sebagai <strong>GURU</strong>. Pengaturan undangan staf dan manajemen peran akun dikelola oleh akun <strong>ADMIN</strong>.
        </div>
      )}
    </div>
  );
};
