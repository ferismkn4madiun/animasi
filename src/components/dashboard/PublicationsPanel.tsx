import React, { useState } from 'react';
import { Edit3, Eye, EyeOff, Star, Trash2, Upload, X } from 'lucide-react';
import type { PublishedWork } from '../../types';
import { uploadAssignmentFile } from '../../services/api';
import {
  deletePublishedWorkRecord,
  updatePublishedWorkRecord,
} from '../../services/firestoreService';
import { formatIndonesianDate } from '../../utils/validation';

interface PublicationsPanelProps {
  works: PublishedWork[];
  onNotify: (msg: string) => void;
}

export const PublicationsPanel: React.FC<PublicationsPanelProps> = ({ works, onNotify }) => {
  const [editingWork, setEditingWork] = useState<PublishedWork | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    coverUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const openEdit = (work: PublishedWork) => {
    setEditingWork(work);
    setForm({
      title: work.title,
      description: work.description,
      thumbnailUrl: work.thumbnailUrl,
      coverUrl: work.coverUrl || work.thumbnailUrl,
    });
  };

  const toggleVisibility = async (work: PublishedWork) => {
    try {
      await updatePublishedWorkRecord(work.id, { isVisible: !work.isVisible });
      onNotify(
        work.isVisible
          ? `"${work.title}" disembunyikan dari galeri publik.`
          : `"${work.title}" ditampilkan kembali di galeri publik.`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mengubah visibilitas karya.');
    }
  };

  const toggleFeatured = async (work: PublishedWork) => {
    try {
      await updatePublishedWorkRecord(work.id, { isFeatured: !work.isFeatured });
      onNotify(
        work.isFeatured
          ? `"${work.title}" dilepas dari karya unggulan.`
          : `"${work.title}" ditetapkan sebagai Karya Unggulan.`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mengubah status unggulan.');
    }
  };

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAssignmentFile(file, 'gallery');
      setForm((p) => ({ ...p, thumbnailUrl: res.fileUrl, coverUrl: res.fileUrl }));
      onNotify('Thumbnail & cover berhasil diperbarui.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mengunggah cover.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWork) return;
    setSaving(true);
    try {
      await updatePublishedWorkRecord(editingWork.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
        coverUrl: form.coverUrl.trim(),
      });
      onNotify(`Publikasi "${form.title}" berhasil diperbarui.`);
      setEditingWork(null);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (work: PublishedWork) => {
    try {
      await deletePublishedWorkRecord(work);
      setConfirmDeleteId(null);
      onNotify(`"${work.title}" dihapus dari daftar publikasi.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menghapus publikasi.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">
          Manajemen Publikasi Galeri
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Atur karya unggulan, foto cover/thumbnail, deskripsi tayangan, serta sembunyikan atau tampilkan karya publik.
        </p>
      </div>

      {works.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-sm text-slate-500">
          Belum ada karya yang dipublikasikan ke Firestore. Setujui karya dari tab Manajemen Tugas atau jalankan isi data awal pada menu Akses &amp; Backup.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {works.map((work) => (
            <div
              key={work.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="flex gap-4 p-4">
                <img
                  src={work.thumbnailUrl}
                  alt={work.title}
                  referrerPolicy="no-referrer"
                  className="w-28 h-24 rounded-xl object-cover bg-slate-100 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-indigo-700">{work.category}</span>{' '}
                    · {work.className} · {formatIndonesianDate(work.publishedAt)}
                  </p>
                  <h3 className="font-display text-base font-bold text-slate-900 truncate mt-1">
                    {work.title}
                  </h3>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{work.groupName}</p>
                  <p className="text-xs mt-2 font-semibold">
                    <span className={work.isVisible ? 'text-emerald-700' : 'text-slate-500'}>
                      {work.isVisible ? 'Ditampilkan Publik' : 'Disembunyikan'}
                    </span>
                    {work.isFeatured && (
                      <span className="text-indigo-700"> · Karya Unggulan</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleVisibility(work)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    {work.isVisible ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        Sembunyikan
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        Tampilkan
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(work)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                      work.isFeatured
                        ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    Unggulan
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(work)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {confirmDeleteId === work.id ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(work)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(work.id)}
                      aria-label={`Hapus publikasi ${work.title}`}
                      className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingWork && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          onClick={() => setEditingWork(null)}
        >
          <form
            onSubmit={handleSave}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Edit Konten Publikasi
              </h3>
              <button
                type="button"
                onClick={() => setEditingWork(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Publikasi
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Publikasi
              </label>
              <textarea
                rows={4}
                required
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                URL Foto Cover / Thumbnail
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  required
                  value={form.thumbnailUrl}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      thumbnailUrl: e.target.value,
                      coverUrl: e.target.value,
                    }))
                  }
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 font-mono text-xs"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Mengunggah...' : 'Ganti Foto'}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingWork(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 disabled:opacity-60 cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan Publikasi'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
