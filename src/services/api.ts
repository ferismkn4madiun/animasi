import { auth } from '../firebase';

export interface UploadedFileResponse {
  storedName: string;
  fileUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export async function uploadAssignmentFile(
  file: File,
  scope: 'submission' | 'gallery' = 'submission'
): Promise<UploadedFileResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const headers = scope === 'gallery' ? await getAuthHeaders() : {};
  const res = await fetch(`/api/upload?scope=${scope}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const data = (await res.json()) as UploadedFileResponse & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Gagal mengunggah file ke server.');
  }
  return data;
}

export async function publishAssetToServer(fileUrl: string): Promise<void> {
  if (!fileUrl.startsWith('/api/files/')) return;
  const headers = await getAuthHeaders();
  const res = await fetch('/api/gallery-assets/publish', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ fileUrl }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Gagal membuka akses aset untuk galeri publik.');
  }
}

export async function syncStaffEmailsToServer(emails: string[]): Promise<void> {
  const headers = await getAuthHeaders();
  const res = await fetch('/api/staff-sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ emails }),
  });
  if (!res.ok) {
    // Non-fatal if user is a non-primary Guru; only primary admin syncs server registry
    console.warn('Sinkronisasi daftar staf dilewati:', res.status);
  }
}

export async function fetchProtectedFileBlobUrl(
  fileUrl: string,
  download = false,
  downloadName?: string
): Promise<string> {
  if (!fileUrl.startsWith('/api/files/')) {
    return fileUrl;
  }
  const headers = await getAuthHeaders();
  const query = new URLSearchParams();
  if (download) query.set('download', '1');
  if (downloadName) query.set('name', downloadName);
  const fullUrl = query.toString() ? `${fileUrl}?${query.toString()}` : fileUrl;
  const res = await fetch(fullUrl, { headers });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Gagal mengunduh file tugas.');
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}
