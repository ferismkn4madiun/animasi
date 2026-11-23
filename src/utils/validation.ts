import type { DashboardStats, PublishedWork, StudentGroup, StudentRecord, Submission } from '../types';

export const ALLOWED_UPLOAD_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.pdf',
  '.mp4',
  '.mov',
  '.webm',
  '.zip',
  '.rar',
  '.blend',
  '.psd',
  '.ai',
  '.svg',
] as const;

export const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  extension?: string;
}

export function getFileExtension(fileName: string): string {
  const trimmed = fileName.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf('.');
  if (lastDot <= 0 || lastDot === trimmed.length - 1) {
    return '';
  }
  return trimmed.slice(lastDot);
}

export function validateFileUpload(
  fileName: string,
  _mimeType: string,
  sizeBytes: number
): FileValidationResult {
  if (!fileName || fileName.trim().length === 0) {
    return { valid: false, error: 'Nama file tidak valid.' };
  }
  const ext = getFileExtension(fileName);
  if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext as (typeof ALLOWED_UPLOAD_EXTENSIONS)[number])) {
    return {
      valid: false,
      error: `Format file "${ext || 'tanpa ekstensi'}" tidak didukung. Gunakan JPG, PNG, PDF, MP4, MOV, ZIP, BLEND, PSD, AI, atau SVG.`,
    };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { valid: false, error: 'File kosong atau ukuran tidak valid.' };
  }
  if (sizeBytes > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file melebihi batas maksimal 50 MB.',
    };
  }
  return { valid: true, extension: ext };
}

export function isValidHttpUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export interface SubmissionFormInput {
  groupName: string;
  leaderName: string;
  members: string[];
  className: string;
  title: string;
  category: string;
  description: string;
  fileUrl: string;
  externalLink: string;
}

export interface SubmissionValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateSubmissionInput(input: SubmissionFormInput): SubmissionValidationResult {
  const errors: Record<string, string> = {};

  if (!input.groupName || input.groupName.trim().length < 2) {
    errors.groupName = 'Nama kelompok minimal 2 karakter.';
  } else if (input.groupName.trim().length > 100) {
    errors.groupName = 'Nama kelompok maksimal 100 karakter.';
  }

  if (!input.leaderName || input.leaderName.trim().length < 2) {
    errors.leaderName = 'Nama ketua kelompok minimal 2 karakter.';
  } else if (input.leaderName.trim().length > 100) {
    errors.leaderName = 'Nama ketua kelompok maksimal 100 karakter.';
  }

  const cleanMembers = input.members.map((m) => m.trim()).filter(Boolean);
  if (cleanMembers.length === 0) {
    errors.members = 'Masukkan minimal 1 nama anggota kelompok.';
  } else if (cleanMembers.length > 15) {
    errors.members = 'Maksimal 15 anggota dalam satu kelompok.';
  }

  if (!input.className || input.className.trim().length < 2) {
    errors.className = 'Pilih kelas / jurusan terlebih dahulu.';
  }

  if (!input.title || input.title.trim().length < 2) {
    errors.title = 'Judul karya atau tugas minimal 2 karakter.';
  } else if (input.title.trim().length > 160) {
    errors.title = 'Judul karya maksimal 160 karakter.';
  }

  if (!input.category || input.category.trim().length < 2) {
    errors.category = 'Pilih kategori karya.';
  }

  if (!input.description || input.description.trim().length < 5) {
    errors.description = 'Deskripsi karya minimal 5 karakter.';
  } else if (input.description.trim().length > 2000) {
    errors.description = 'Deskripsi karya maksimal 2000 karakter.';
  }

  const hasFile = input.fileUrl.trim().length > 0;
  const hasExternalLink = input.externalLink.trim().length > 0;
  if (!hasFile && !hasExternalLink) {
    errors.attachment = 'Unggah file tugas atau sertakan tautan Google Drive / YouTube.';
  }

  if (hasExternalLink && !isValidHttpUrl(input.externalLink)) {
    errors.externalLink = 'Tautan harus diawali https:// atau http:// yang valid.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function parseYouTubeEmbedUrl(url: string): string | null {
  if (!isValidHttpUrl(url)) return null;
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    let videoId: string | null = null;
    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
    } else if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v');
      } else if (parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2] ?? null;
      }
    }
    if (videoId && /^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  } catch {
    return null;
  }
}

export function generateTrackingCode(now = new Date()): string {
  const year = now.getFullYear();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 5; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ANM-${year}-${suffix}`;
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIdx = 0;
  while (value >= 1024 && unitIdx < units.length - 1) {
    value /= 1024;
    unitIdx += 1;
  }
  return `${value >= 10 || unitIdx === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIdx]}`;
}

export function slugifyCategory(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function computeDashboardStats(params: {
  students: StudentRecord[];
  groups: StudentGroup[];
  submissions: Submission[];
  publishedWorks: PublishedWork[];
}): DashboardStats {
  const { students, groups, submissions, publishedWorks } = params;

  const uniqueStudentNames = new Set<string>();
  for (const s of students) {
    if (s.fullName.trim()) uniqueStudentNames.add(s.fullName.trim().toLowerCase());
  }
  for (const g of groups) {
    if (g.leaderName.trim()) uniqueStudentNames.add(g.leaderName.trim().toLowerCase());
    for (const m of g.members) {
      if (m.trim()) uniqueStudentNames.add(m.trim().toLowerCase());
    }
  }
  for (const sub of submissions) {
    if (sub.leaderName.trim()) uniqueStudentNames.add(sub.leaderName.trim().toLowerCase());
    for (const m of sub.members) {
      if (m.trim()) uniqueStudentNames.add(m.trim().toLowerCase());
    }
  }

  const uniqueGroupNames = new Set<string>();
  for (const g of groups) {
    if (g.name.trim()) uniqueGroupNames.add(g.name.trim().toLowerCase());
  }
  for (const sub of submissions) {
    if (sub.groupName.trim()) uniqueGroupNames.add(sub.groupName.trim().toLowerCase());
  }

  const gradedSubmissions = submissions.filter((s) => typeof s.score === 'number').length;
  const pendingSubmissions = submissions.filter(
    (s) => s.status === 'Menunggu' || typeof s.score !== 'number'
  ).length;
  const publishedVisible = publishedWorks.filter((w) => w.isVisible).length;

  const classMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  for (const sub of submissions) {
    const cls = sub.className.trim() || 'Lainnya';
    classMap.set(cls, (classMap.get(cls) ?? 0) + 1);
    const cat = sub.category.trim() || 'Lainnya';
    categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + 1);
  }

  return {
    totalStudents: Math.max(students.length, uniqueStudentNames.size),
    totalGroups: Math.max(groups.length, uniqueGroupNames.size),
    totalSubmissions: submissions.length,
    gradedSubmissions,
    pendingSubmissions,
    publishedWorks: publishedVisible,
    byClass: Array.from(classMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    byCategory: Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}

export function buildWhatsAppShareUrl(work: Pick<PublishedWork, 'id' | 'title' | 'groupName' | 'className' | 'category'>, originUrl: string): string {
  const link = `${originUrl.replace(/\/$/, '')}/?karya=${encodeURIComponent(work.id)}`;
  const text = `Lihat karya "${work.title}" (${work.category}) oleh ${work.groupName} - ${work.className} di Galeri Karya Siswa SMK Animasi: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function formatIndonesianDate(value: unknown): string {
  if (!value) return '-';
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  } else if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === 'object' && value !== null && 'seconds' in value && typeof (value as { seconds: number }).seconds === 'number') {
    date = new Date((value as { seconds: number }).seconds * 1000);
  }
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
