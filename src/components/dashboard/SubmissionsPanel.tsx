import React, { useMemo, useState } from 'react';
import {
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Globe,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type {
  AnimationClass,
  MediaType,
  Submission,
  SubmissionStatus,
  WorkCategory,
} from '../../types';
import { SEED_PUBLISHED_WORKS } from '../../data/seedWorks';
import { fetchProtectedFileBlobUrl, uploadAssignmentFile } from '../../services/api';
import {
  deleteSubmissionRecord,
  publishSubmissionToGallery,
  updateSubmissionByTeacher,
} from '../../services/firestoreService';
import { formatFileSize, formatIndonesianDate, isValidHttpUrl } from '../../utils/validation';

interface SubmissionsPanelProps {
  submissions: Submission[];
  classes: AnimationClass[];
  categories: WorkCategory[];
  onNotify: (msg: string) => void;
}

const STATUS_OPTIONS: SubmissionStatus[] = ['Menunggu', 'Diterima', 'Revisi', 'Selesai'];

const STATUS_TEXT_COLOR: Record<SubmissionStatus, string> = {
  Menunggu: 'text-amber-700',
  Diterima: 'text-blue-700',
  Revisi: 'text-rose-700',
  Selesai: 'text-emerald-700',
};

export const SubmissionsPanel: React.FC<SubmissionsPanelProps> = ({
  submissions,
  classes,
  categories,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');

  const [editingSub, setEditingSub] = useState<Submission | null>(null);
  const [editForm, setEditForm] = useState({
    groupName: '',
    leaderName: '',
    membersText: '',
    className: '',
    title: '',
    category: '',
    description: '',
    status: 'Menunggu' as SubmissionStatus,
    score: '',
    revisionNote: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const [publishingSub, setPublishingSub] = useState<Submission | null>(null);
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    isFeatured: false,
  });
  const [uploadingCover, setUploadingCover] = useState(false);
  const [savingPublish, setSavingPublish] = useState(false);

  const [previewData, setPreviewData] = useState<{
    title: string;
    url: string;
    mimeType: string;
    fileName: string;
  } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return submissions.filter((s) => {
      if (statusFilter !== 'Semua' && s.status !== statusFilter) return false;
      if (categoryFilter !== 'Semua' && s.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        s.title.toLowerCase().includes(q) ||
        s.groupName.toLowerCase().includes(q) ||
        s.leaderName.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.trackingCode.toLowerCase().includes(q) ||
        s.members.some((m) => m.toLowerCase().includes(q))
      );
    });
  }, [submissions, searchQuery, statusFilter, categoryFilter]);

  const openEditModal = (sub: Submission) => {
    setEditingSub(sub);
    setEditForm({
      groupName: sub.groupName,
      leaderName: sub.leaderName,
      membersText: sub.members.join(', '),
      className: sub.className,
      title: sub.title,
      category: sub.category,
      description: sub.description,
      status: sub.status,
      score: typeof sub.score === 'number' ? String(sub.score) : '',
      revisionNote: sub.revisionNote || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;
    setSavingEdit(true);
    try {
      const parsedScore =
        editForm.score.trim() === ''
          ? null
          : Math.min(100, Math.max(0, Number(editForm.score)));
      const members = editForm.membersText
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean);

      await updateSubmissionByTeacher(editingSub, {
        groupName: editForm.groupName,
        leaderName: editForm.leaderName,
        members: members.length ? members : [editForm.leaderName.trim()],
        className: editForm.className,
        title: editForm.title,
        category: editForm.category,
        description: editForm.description,
        status: editForm.status,
        score: Number.isNaN(parsedScore) ? null : parsedScore,
        revisionNote: editForm.revisionNote,
      });
      onNotify(`Data tugas "${editForm.title}" berhasil diperbarui.`);
      setEditingSub(null);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal memperbarui tugas.');
    } finally {
      setSavingEdit(false);
    }
  };

  const openPublishModal = (sub: Submission) => {
    setPublishingSub(sub);
    const isImageFile = /\.(jpg|jpeg|png|webp|svg)$/i.test(sub.fileName || '');
    const fallbackThumb =
      SEED_PUBLISHED_WORKS.find((w) => w.category === sub.category)?.thumbnailUrl ||
      SEED_PUBLISHED_WORKS[0].thumbnailUrl;

    setPublishForm({
      title: sub.title,
      description: sub.description,
      thumbnailUrl: isImageFile && sub.fileUrl ? sub.fileUrl : fallbackThumb,
      isFeatured: false,
    });
  };

  const handleCoverUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploadingCover(true);
    try {
      const res = await uploadAssignmentFile(file, 'gallery');
      setPublishForm((prev) => ({ ...prev, thumbnailUrl: res.fileUrl }));
      onNotify('Gambar cover berhasil diunggah.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mengunggah gambar cover.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleConfirmPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishingSub) return;
    setSavingPublish(true);
    try {
      const isVideo = /\.(mp4|mov|webm)$/i.test(publishingSub.fileName || '');
      const isImage = /\.(jpg|jpeg|png|webp|svg)$/i.test(publishingSub.fileName || '');
      let mediaType: MediaType = 'image';
      let mediaUrl = publishForm.thumbnailUrl;

      if (isVideo && publishingSub.fileUrl) {
        mediaType = 'video';
        mediaUrl = publishingSub.fileUrl;
      } else if (publishingSub.externalLink && !isImage) {
        mediaType = 'embed';
      } else if (isImage && publishingSub.fileUrl) {
        mediaType = 'image';
        mediaUrl = publishingSub.fileUrl;
      }

      await publishSubmissionToGallery({
        submission: publishingSub,
        title: publishForm.title,
        description: publishForm.description,
        thumbnailUrl: publishForm.thumbnailUrl,
        coverUrl: publishForm.thumbnailUrl,
        mediaType,
        mediaUrl,
        isFeatured: publishForm.isFeatured,
      });
      onNotify(`Karya "${publishForm.title}" resmi dipublikasikan ke Galeri Online.`);
      setPublishingSub(null);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mempublikasikan karya.');
    } finally {
      setSavingPublish(false);
    }
  };

  const handleDownloadFile = async (sub: Submission) => {
    if (!sub.fileUrl) return;
    try {
      const blobUrl = await fetchProtectedFileBlobUrl(sub.fileUrl, true, sub.fileName);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = sub.fileName || 'tugas-siswa';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal mengunduh file.');
    }
  };

  const handlePreviewFile = async (sub: Submission) => {
    if (!sub.fileUrl) return;
    try {
      const blobUrl = await fetchProtectedFileBlobUrl(sub.fileUrl, false);
      setPreviewData({
        title: sub.title,
        url: blobUrl,
        mimeType: sub.fileType,
        fileName: sub.fileName,
      });
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal membuka pratinjau file.');
    }
  };

  const handleDelete = async (sub: Submission) => {
    try {
      await deleteSubmissionRecord(sub);
      setConfirmDeleteId(null);
      onNotify(`Tugas "${sub.title}" dihapus.`);
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menghapus tugas.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">
            Manajemen Tugas &amp; Penilaian
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Tinjau file karya siswa, berikan nilai serta catatan revisi, dan setujui publikasi ke galeri.
          </p>
        </div>
        <p className="font-mono text-xs text-slate-500 tabular-nums">
          {filtered.length} dari {submissions.length} tugas
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama siswa, kelompok, kelas, kode, atau judul tugas..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter status tugas"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
          >
            <option value="Semua">Semua Status</option>
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter kategori tugas"
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
          >
            <option value="Semua">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-500">
            Belum ada tugas yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3.5 px-4">Karya &amp; Kelompok</th>
                  <th className="py-3.5 px-4">Kelas / Kategori</th>
                  <th className="py-3.5 px-4">Lampiran</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Nilai</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-semibold text-slate-900 truncate">{sub.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {sub.groupName} · Ketua: {sub.leaderName}
                      </p>
                      <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                        {sub.trackingCode} · {formatIndonesianDate(sub.submittedAt)}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <p className="text-xs font-medium text-slate-800">{sub.className}</p>
                      <p className="text-xs text-indigo-700 mt-0.5">{sub.category}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {sub.fileUrl && (
                          <>
                            <button
                              type="button"
                              onClick={() => handlePreviewFile(sub)}
                              title={`Pratinjau ${sub.fileName}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Lihat
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(sub)}
                              title={`Unduh ${sub.fileName} (${formatFileSize(sub.fileSize)})`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Unduh
                            </button>
                          </>
                        )}
                        {sub.externalLink && isValidHttpUrl(sub.externalLink) && (
                          <a
                            href={sub.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Tautan
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`text-xs font-bold ${STATUS_TEXT_COLOR[sub.status]}`}>
                        {sub.status}
                      </span>
                      {sub.isPublished && (
                        <p className="text-[11px] text-emerald-700 mt-0.5">Tayang di Galeri</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 tabular-nums">
                      {typeof sub.score === 'number' ? sub.score : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(sub)}
                          aria-label={`Nilai dan edit ${sub.title}`}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Nilai
                        </button>
                        <button
                          type="button"
                          onClick={() => openPublishModal(sub)}
                          aria-label={`Publikasikan ${sub.title}`}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 cursor-pointer inline-flex items-center gap-1"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          {sub.isPublished ? 'Perbarui' : 'Publikasi'}
                        </button>
                        {confirmDeleteId === sub.id ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(sub)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Konfirmasi
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(sub.id)}
                            aria-label={`Hapus ${sub.title}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit & Grade Modal */}
      {editingSub && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditingSub(null)}
        >
          <form
            onSubmit={handleSaveEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Edit &amp; Penilaian Tugas
              </h3>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                aria-label="Tutup modal edit"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Karya
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kelompok
                </label>
                <input
                  type="text"
                  required
                  value={editForm.groupName}
                  onChange={(e) => setEditForm((p) => ({ ...p, groupName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Ketua Kelompok
                </label>
                <input
                  type="text"
                  required
                  value={editForm.leaderName}
                  onChange={(e) => setEditForm((p) => ({ ...p, leaderName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Anggota (pisahkan koma)
                </label>
                <input
                  type="text"
                  required
                  value={editForm.membersText}
                  onChange={(e) => setEditForm((p) => ({ ...p, membersText: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kelas</label>
                <select
                  value={editForm.className}
                  onChange={(e) => setEditForm((p) => ({ ...p, className: e.target.value }))}
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Tugas
                </label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, status: e.target.value as SubmissionStatus }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nilai (0 - 100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editForm.score}
                  onChange={(e) => setEditForm((p) => ({ ...p, score: e.target.value }))}
                  placeholder="Kosongkan jika belum dinilai"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 font-mono text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan Revisi / Komentar Guru
              </label>
              <textarea
                rows={3}
                value={editForm.revisionNote}
                onChange={(e) => setEditForm((p) => ({ ...p, revisionNote: e.target.value }))}
                placeholder="Berikan masukan teknis animasi, timing, pencahayaan, atau revisi..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="px-5 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 disabled:opacity-60 cursor-pointer"
              >
                {savingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Publish to Gallery Modal */}
      {publishingSub && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setPublishingSub(null)}
        >
          <form
            onSubmit={handleConfirmPublish}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-display text-lg font-bold text-slate-900">
                Persetujuan &amp; Publikasi Karya
              </h3>
              <button
                type="button"
                onClick={() => setPublishingSub(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Judul Publikasi Galeri
              </label>
              <input
                type="text"
                required
                value={publishForm.title}
                onChange={(e) => setPublishForm((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi Publikasi
              </label>
              <textarea
                rows={3}
                required
                value={publishForm.description}
                onChange={(e) => setPublishForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Cover / Thumbnail Karya
              </label>
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                  type="text"
                  required
                  value={publishForm.thumbnailUrl}
                  onChange={(e) => setPublishForm((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                  className="flex-1 w-full px-3 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                />
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  {uploadingCover ? 'Mengunggah...' : 'Unggah Cover'}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleCoverUpload(e.target.files?.[0])}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={publishForm.isFeatured}
                onChange={(e) => setPublishForm((p) => ({ ...p, isFeatured: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-700"
              />
              Jadikan Karya Unggulan di halaman utama galeri
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPublishingSub(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingPublish}
                className="px-5 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 disabled:opacity-60 cursor-pointer"
              >
                {savingPublish ? 'Mempublikasikan...' : 'Setujui & Publikasikan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Authenticated File Preview Modal */}
      {previewData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 flex items-center justify-center p-4"
          onClick={() => {
            URL.revokeObjectURL(previewData.url);
            setPreviewData(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden border border-slate-200"
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <p className="font-semibold text-sm text-slate-900 truncate">
                {previewData.title} — {previewData.fileName}
              </p>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(previewData.url);
                  setPreviewData(null);
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-slate-950 flex items-center justify-center max-h-[75vh]">
              {previewData.mimeType.startsWith('image/') ||
              /\.(jpg|jpeg|png|webp|svg)$/i.test(previewData.fileName) ? (
                <img
                  src={previewData.url}
                  alt={previewData.title}
                  className="max-h-[72vh] object-contain"
                />
              ) : previewData.mimeType.startsWith('video/') ||
                /\.(mp4|mov|webm)$/i.test(previewData.fileName) ? (
                <video src={previewData.url} controls className="max-h-[72vh] w-full" />
              ) : previewData.mimeType === 'application/pdf' ||
                /\.pdf$/i.test(previewData.fileName) ? (
                <iframe
                  src={previewData.url}
                  title={previewData.fileName}
                  className="w-full h-[72vh] bg-white"
                />
              ) : (
                <div className="p-12 text-center text-slate-300 space-y-3">
                  <p className="text-sm">
                    File proyek <span className="font-mono">{previewData.fileName}</span> siap diunduh untuk dibuka di aplikasi animasi terkait (Blender, Photoshop, dll.).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
