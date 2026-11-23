import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  AnimationClass,
  StudentGroup,
  StudentRecord,
  WorkCategory,
} from '../../types';
import {
  deleteCategoryRecord,
  deleteClassRecord,
  deleteGroupRecord,
  deleteStudentRecord,
  saveCategoryRecord,
  saveClassRecord,
  saveGroupRecord,
  saveStudentRecord,
} from '../../services/firestoreService';

interface MasterDataPanelProps {
  students: StudentRecord[];
  groups: StudentGroup[];
  classes: AnimationClass[];
  categories: WorkCategory[];
  onNotify: (msg: string) => void;
}

type MasterTab = 'students' | 'groups' | 'classes' | 'categories';

export const MasterDataPanel: React.FC<MasterDataPanelProps> = ({
  students,
  groups,
  classes,
  categories,
  onNotify,
}) => {
  const [tab, setTab] = useState<MasterTab>('students');

  // Student form
  const [stuForm, setStuForm] = useState({
    nis: '',
    fullName: '',
    className: classes[0]?.name || 'XI Animasi 1',
    groupName: '',
  });
  // Group form
  const [grpForm, setGrpForm] = useState({
    name: '',
    className: classes[0]?.name || 'XI Animasi 1',
    leaderName: '',
    membersText: '',
  });
  // Class form
  const [clsForm, setClsForm] = useState({
    name: '',
    grade: 'XI' as 'X' | 'XI' | 'XII',
    major: 'Animasi',
    homeroomTeacher: '',
  });
  // Category form
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
  });

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stuForm.nis.trim() || !stuForm.fullName.trim()) return;
    try {
      await saveStudentRecord({
        nis: stuForm.nis,
        fullName: stuForm.fullName,
        className: stuForm.className,
        groupName: stuForm.groupName,
        email: '',
      });
      setStuForm((p) => ({ ...p, nis: '', fullName: '', groupName: '' }));
      onNotify('Data siswa berhasil ditambahkan.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menambah siswa.');
    }
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grpForm.name.trim() || !grpForm.leaderName.trim()) return;
    const members = grpForm.membersText
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);
    try {
      await saveGroupRecord({
        name: grpForm.name,
        className: grpForm.className,
        leaderName: grpForm.leaderName,
        members: members.length ? members : [grpForm.leaderName.trim()],
      });
      setGrpForm((p) => ({ ...p, name: '', leaderName: '', membersText: '' }));
      onNotify('Data kelompok berhasil ditambahkan.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menambah kelompok.');
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clsForm.name.trim()) return;
    try {
      await saveClassRecord(clsForm);
      setClsForm({ name: '', grade: 'XI', major: 'Animasi', homeroomTeacher: '' });
      onNotify('Data kelas berhasil ditambahkan.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menambah kelas.');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;
    try {
      await saveCategoryRecord(catForm);
      setCatForm({ name: '', description: '' });
      onNotify('Kategori karya berhasil ditambahkan.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menambah kategori.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Master Data Akademik Animasi
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Kelola daftar siswa, kelompok produksi, rombongan belajar, dan kategori tugas karya.
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-100 rounded-xl w-fit">
        {(
          [
            { id: 'students', label: `Siswa (${students.length})` },
            { id: 'groups', label: `Kelompok (${groups.length})` },
            { id: 'classes', label: `Kelas (${classes.length})` },
            { id: 'categories', label: `Kategori (${categories.length})` },
          ] as Array<{ id: MasterTab; label: string }>
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              tab === item.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Students */}
      {tab === 'students' && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddStudent}
            className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">NIS</label>
              <input
                type="text"
                required
                value={stuForm.nis}
                onChange={(e) => setStuForm((p) => ({ ...p, nis: e.target.value }))}
                placeholder="24001"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Siswa</label>
              <input
                type="text"
                required
                value={stuForm.fullName}
                onChange={(e) => setStuForm((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Nama lengkap"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
              <select
                value={stuForm.className}
                onChange={(e) => setStuForm((p) => ({ ...p, className: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kelompok</label>
              <input
                type="text"
                value={stuForm.groupName}
                onChange={(e) => setStuForm((p) => ({ ...p, groupName: e.target.value }))}
                placeholder="Opsional"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 cursor-pointer h-[38px]"
            >
              <Plus className="w-4 h-4" />
              Tambah Siswa
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {students.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Belum ada data siswa.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {students.map((s) => (
                  <div key={s.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        <span className="font-mono text-xs text-slate-500 mr-2">{s.nis}</span>
                        {s.fullName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {s.className}
                        {s.groupName ? ` · Kelompok: ${s.groupName}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        deleteStudentRecord(s.id)
                          .then(() => onNotify(`Siswa ${s.fullName} dihapus.`))
                          .catch((err) => onNotify(err.message))
                      }
                      aria-label={`Hapus siswa ${s.fullName}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Groups */}
      {tab === 'groups' && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddGroup}
            className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelompok</label>
              <input
                type="text"
                required
                value={grpForm.name}
                onChange={(e) => setGrpForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Studio Senja"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
              <select
                value={grpForm.className}
                onChange={(e) => setGrpForm((p) => ({ ...p, className: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ketua</label>
              <input
                type="text"
                required
                value={grpForm.leaderName}
                onChange={(e) => setGrpForm((p) => ({ ...p, leaderName: e.target.value }))}
                placeholder="Nama ketua"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Anggota (koma)
              </label>
              <input
                type="text"
                value={grpForm.membersText}
                onChange={(e) => setGrpForm((p) => ({ ...p, membersText: e.target.value }))}
                placeholder="Raka, Sinta, Dimas"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 cursor-pointer h-[38px]"
            >
              <Plus className="w-4 h-4" />
              Tambah Kelompok
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {groups.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-500">Belum ada data kelompok.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {groups.map((g) => (
                  <div key={g.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {g.name} <span className="text-xs font-normal text-indigo-700">· {g.className}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Ketua: {g.leaderName} · Anggota: {g.members.join(', ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        deleteGroupRecord(g.id)
                          .then(() => onNotify(`Kelompok ${g.name} dihapus.`))
                          .catch((err) => onNotify(err.message))
                      }
                      aria-label={`Hapus kelompok ${g.name}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Classes */}
      {tab === 'classes' && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddClass}
            className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kelas</label>
              <input
                type="text"
                required
                value={clsForm.name}
                onChange={(e) => setClsForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="XI Animasi 3"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tingkat</label>
              <select
                value={clsForm.grade}
                onChange={(e) =>
                  setClsForm((p) => ({ ...p, grade: e.target.value as 'X' | 'XI' | 'XII' }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
              >
                <option value="X">X</option>
                <option value="XI">XI</option>
                <option value="XII">XII</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Jurusan</label>
              <input
                type="text"
                required
                value={clsForm.major}
                onChange={(e) => setClsForm((p) => ({ ...p, major: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Wali Kelas</label>
              <input
                type="text"
                value={clsForm.homeroomTeacher}
                onChange={(e) =>
                  setClsForm((p) => ({ ...p, homeroomTeacher: e.target.value }))
                }
                placeholder="Opsional"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 cursor-pointer h-[38px]"
            >
              <Plus className="w-4 h-4" />
              Tambah Kelas
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {classes.map((c) => (
              <div key={c.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {c.name} · {c.major}
                  </p>
                  {c.homeroomTeacher && (
                    <p className="text-xs text-slate-500 mt-0.5">Wali: {c.homeroomTeacher}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    deleteClassRecord(c.id)
                      .then(() => onNotify(`Kelas ${c.name} dihapus.`))
                      .catch((err) => onNotify(err.message))
                  }
                  aria-label={`Hapus kelas ${c.name}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="space-y-5">
          <form
            onSubmit={handleAddCategory}
            className="bg-white border border-slate-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kategori
              </label>
              <input
                type="text"
                required
                value={catForm.name}
                onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Stop Motion / VFX"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
              <input
                type="text"
                value={catForm.description}
                onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Keterangan singkat kategori"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 cursor-pointer h-[38px]"
            >
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </button>
          </form>

          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{cat.name}</p>
                  {cat.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    deleteCategoryRecord(cat.id)
                      .then(() => onNotify(`Kategori ${cat.name} dihapus.`))
                      .catch((err) => onNotify(err.message))
                  }
                  aria-label={`Hapus kategori ${cat.name}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
