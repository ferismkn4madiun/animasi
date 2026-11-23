import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  FileUp,
  Link as LinkIcon,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { AnimationClass, UserAccount, WorkCategory } from '../types';
import { uploadAssignmentFile } from '../services/api';
import { createSubmissionRecord } from '../services/firestoreService';
import {
  ALLOWED_UPLOAD_EXTENSIONS,
  formatFileSize,
  validateFileUpload,
  validateSubmissionInput,
} from '../utils/validation';

interface SubmissionFormProps {
  classes: AnimationClass[];
  categories: WorkCategory[];
  userProfile: UserAccount | null;
  onGoToStatus: (trackingCode: string) => void;
}

export const SubmissionForm: React.FC<SubmissionFormProps> = ({
  classes,
  categories,
  userProfile,
  onGoToStatus,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [groupName, setGroupName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [members, setMembers] = useState<string[]>(['']);
  const [className, setClassName] = useState(classes[0]?.name || 'XI Animasi 1');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '2D');
  const [description, setDescription] = useState('');
  const [externalLink, setExternalLink] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [receipt, setReceipt] = useState<{
    trackingCode: string;
    title: string;
    groupName: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const todayFormatted = useMemo(
    () =>
      new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  const handleFilePicked = (file: File | undefined) => {
    setFileError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const check = validateFileUpload(file.name, file.type, file.size);
    if (!check.valid) {
      setSelectedFile(null);
      setFileError(check.error || 'File tidak valid.');
      return;
    }
    setSelectedFile(file);
  };

  const handleMemberChange = (index: number, value: string) => {
    setMembers((prev) => prev.map((m, i) => (i === index ? value : m)));
  };

  const addMemberField = () => {
    if (members.length < 15) {
      setMembers((prev) => [...prev, '']);
    }
  };

  const removeMemberField = (index: number) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const validation = validateSubmissionInput({
      groupName,
      leaderName,
      members,
      className,
      title,
      category,
      description,
      fileUrl: selectedFile ? selectedFile.name : '',
      externalLink,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      let fileUrl = '';
      let fileName = '';
      let fileType = '';
      let fileSize = 0;

      if (selectedFile) {
        const uploaded = await uploadAssignmentFile(selectedFile, 'submission');
        fileUrl = uploaded.fileUrl;
        fileName = uploaded.originalName;
        fileType = uploaded.mimeType;
        fileSize = uploaded.size;
      }

      const result = await createSubmissionRecord({
        groupName,
        leaderName,
        members,
        className,
        title,
        category,
        description,
        fileUrl,
        fileName,
        fileType,
        fileSize,
        externalLink,
        submitterUid: userProfile?.uid || '',
      });

      setReceipt({
        trackingCode: result.trackingCode,
        title: title.trim(),
        groupName: groupName.trim(),
      });

      // Reset form fields
      setGroupName('');
      setLeaderName('');
      setMembers(['']);
      setTitle('');
      setDescription('');
      setExternalLink('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengirim tugas. Silakan coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = async () => {
    if (!receipt) return;
    try {
      await navigator.clipboard.writeText(receipt.trackingCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-indigo-700">
          Formulir Pengumpulan Resmi
        </p>
        <h1 className="font-display text-3xl font-bold text-slate-900">
          Kirim Tugas Karya Animasi
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
          Lengkapi identitas kelompok, deskripsi karya, dan unggah file proyek atau tautan Google Drive / YouTube. Karya akan diperiksa guru sebelum dinilai dan dipublikasikan.
        </p>
      </div>

      {receipt && (
        <div
          role="status"
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-display text-lg font-bold text-emerald-950">
                Tugas Berhasil Dikirim
              </h2>
              <p className="text-sm text-emerald-800">
                Karya <strong>{receipt.title}</strong> dari kelompok{' '}
                <strong>{receipt.groupName}</strong> telah masuk dengan status{' '}
                <strong>Menunggu</strong>.
              </p>
            </div>
          </div>
          <div className="bg-white border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Kode Pelacakan Status (Simpan Kode Ini)</p>
              <p
                data-testid="tracking-code-output"
                className="font-mono text-lg font-bold text-indigo-700 mt-0.5"
              >
                {receipt.trackingCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedCode ? 'Tersalin' : 'Salin Kode'}
              </button>
              <button
                type="button"
                onClick={() => onGoToStatus(receipt.trackingCode)}
                className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-semibold hover:bg-indigo-800 cursor-pointer"
              >
                Lacak Status
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6"
      >
        {/* Automatic Submission Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-500">Tanggal Pengumpulan Otomatis</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{todayFormatted}</p>
          </div>
          <p className="text-xs text-slate-500">
            Status awal otomatis: <span className="font-semibold text-amber-700">Menunggu</span>
          </p>
        </div>

        {/* Group & Identity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="groupName" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Kelompok *
            </label>
            <input
              id="groupName"
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Contoh: Studio Senja 2D"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {errors.groupName && (
              <p className="text-xs text-rose-600 mt-1">{errors.groupName}</p>
            )}
          </div>

          <div>
            <label htmlFor="leaderName" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Nama Ketua Kelompok *
            </label>
            <input
              id="leaderName"
              type="text"
              value={leaderName}
              onChange={(e) => setLeaderName(e.target.value)}
              placeholder="Nama lengkap ketua"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            {errors.leaderName && (
              <p className="text-xs text-rose-600 mt-1">{errors.leaderName}</p>
            )}
          </div>
        </div>

        {/* All Members */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label className="block text-xs font-semibold text-slate-700">
              Nama Seluruh Anggota Kelompok *
            </label>
            <button
              type="button"
              onClick={addMemberField}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Anggota
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => handleMemberChange(index, e.target.value)}
                  aria-label={`Anggota kelompok ${index + 1}`}
                  placeholder={`Anggota ${index + 1}`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMemberField(index)}
                    aria-label={`Hapus anggota ${index + 1}`}
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.members && <p className="text-xs text-rose-600">{errors.members}</p>}
        </div>

        {/* Class & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="className" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kelas / Jurusan *
            </label>
            <select
              id="className"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.name}>
                  {cls.name} — {cls.major}
                </option>
              ))}
            </select>
            {errors.className && (
              <p className="text-xs text-rose-600 mt-1">{errors.className}</p>
            )}
          </div>

          <div>
            <label htmlFor="category" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kategori Karya *
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-xs text-rose-600 mt-1">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Work Title & Description */}
        <div>
          <label htmlFor="workTitle" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Judul Karya atau Tugas *
          </label>
          <input
            id="workTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Petualangan Lentera Bambu Episode 1"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          {errors.title && <p className="text-xs text-rose-600 mt-1">{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="workDescription" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Deskripsi Karya *
          </label>
          <textarea
            id="workDescription"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan konsep cerita, perangkat lunak yang digunakan (Blender, Clip Studio Paint, After Effects, dll.), serta pembagian peran anggota..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          {errors.description && (
            <p className="text-xs text-rose-600 mt-1">{errors.description}</p>
          )}
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label htmlFor="assignmentFile" className="block text-xs font-semibold text-slate-700">
            Upload File Tugas (Maksimal 50 MB)
          </label>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilePicked(e.dataTransfer.files?.[0]);
            }}
            className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50"
          >
            <input
              ref={fileInputRef}
              id="assignmentFile"
              type="file"
              accept={ALLOWED_UPLOAD_EXTENSIONS.join(',')}
              onChange={(e) => handleFilePicked(e.target.files?.[0])}
              className="sr-only"
            />
            <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            {selectedFile ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">
                  {selectedFile.name}{' '}
                  <span className="font-mono text-xs text-slate-500">
                    ({formatFileSize(selectedFile.size)})
                  </span>
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-indigo-700 hover:underline cursor-pointer"
                  >
                    Ganti File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  <FileUp className="w-4 h-4 text-indigo-700" />
                  Pilih File Karya
                </button>
                <p className="text-xs text-slate-500">
                  Mendukung JPG, PNG, PDF, MP4, MOV, ZIP, BLEND, PSD, AI, SVG
                </p>
              </div>
            )}
          </div>
          {fileError && <p className="text-xs text-rose-600">{fileError}</p>}
          {errors.attachment && <p className="text-xs text-rose-600">{errors.attachment}</p>}
        </div>

        {/* Optional Google Drive / YouTube Link */}
        <div>
          <label htmlFor="externalLink" className="block text-xs font-semibold text-slate-700 mb-1.5">
            Link Google Drive atau YouTube (Opsional)
          </label>
          <div className="relative">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="externalLink"
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://drive.google.com/... atau https://youtu.be/..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          {errors.externalLink && (
            <p className="text-xs text-rose-600 mt-1">{errors.externalLink}</p>
          )}
        </div>

        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {submitError}
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-indigo-700 text-white text-sm font-bold tracking-wide hover:bg-indigo-800 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting ? 'MENGIRIM TUGAS...' : 'KIRIM TUGAS'}
          </button>
        </div>
      </form>
    </div>
  );
};
