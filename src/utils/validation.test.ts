import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppShareUrl,
  computeDashboardStats,
  formatFileSize,
  isValidHttpUrl,
  parseYouTubeEmbedUrl,
  validateFileUpload,
  validateSubmissionInput,
} from './validation';
import type { PublishedWork, StudentGroup, StudentRecord, Submission } from '../types';

test('validateFileUpload accepts animation formats (.blend, .psd, .mp4, .jpg, .zip) within 50MB', () => {
  assert.equal(validateFileUpload('robot_rig.blend', 'application/octet-stream', 12_000_000).valid, true);
  assert.equal(validateFileUpload('character_sheet.PSD', 'image/vnd.adobe.photoshop', 8_500_000).valid, true);
  assert.equal(validateFileUpload('final_animasi.mp4', 'video/mp4', 45_000_000).valid, true);
  assert.equal(validateFileUpload('storyboard.pdf', 'application/pdf', 2_000_000).valid, true);
});

test('validateFileUpload rejects unsupported extensions and oversized files', () => {
  const exeRes = validateFileUpload('installer.exe', 'application/x-msdownload', 1024);
  assert.equal(exeRes.valid, false);
  assert.match(exeRes.error ?? '', /tidak didukung/i);

  const bigRes = validateFileUpload('render.mp4', 'video/mp4', 60 * 1024 * 1024);
  assert.equal(bigRes.valid, false);
  assert.match(bigRes.error ?? '', /50 MB/i);
});

test('isValidHttpUrl allows http/https and blocks javascript/data schemes', () => {
  assert.equal(isValidHttpUrl('https://drive.google.com/file/d/123'), true);
  assert.equal(isValidHttpUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), true);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('data:text/html,<script>alert(1)</script>'), false);
});

test('parseYouTubeEmbedUrl parses watch, youtu.be, and shorts links', () => {
  assert.equal(
    parseYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123XYZ'),
    'https://www.youtube.com/embed/abc123XYZ'
  );
  assert.equal(
    parseYouTubeEmbedUrl('https://youtu.be/xyz789ABC'),
    'https://www.youtube.com/embed/xyz789ABC'
  );
  assert.equal(parseYouTubeEmbedUrl('https://drive.google.com/file/d/123'), null);
});

test('validateSubmissionInput requires core fields and either file or link', () => {
  const invalidEmpty = validateSubmissionInput({
    groupName: '',
    leaderName: 'A',
    members: [],
    className: '',
    title: '',
    category: '',
    description: 'Hi',
    fileUrl: '',
    externalLink: '',
  });
  assert.equal(invalidEmpty.valid, false);
  assert.ok(invalidEmpty.errors.groupName);
  assert.ok(invalidEmpty.errors.members);
  assert.ok(invalidEmpty.errors.attachment);

  const invalidUrl = validateSubmissionInput({
    groupName: 'Studio Senja',
    leaderName: 'Raka Pratama',
    members: ['Raka Pratama'],
    className: 'XI Animasi 1',
    title: 'Lentera Bambu',
    category: '2D',
    description: 'Animasi pendek 2D bertema petualangan.',
    fileUrl: '',
    externalLink: 'javascript:alert(1)',
  });
  assert.equal(invalidUrl.valid, false);
  assert.ok(invalidUrl.errors.externalLink);

  const valid = validateSubmissionInput({
    groupName: 'Studio Senja',
    leaderName: 'Raka Pratama',
    members: ['Raka Pratama', 'Sinta Dewi'],
    className: 'XI Animasi 1',
    title: 'Lentera Bambu',
    category: '2D',
    description: 'Animasi pendek 2D bertema petualangan Nusantara.',
    fileUrl: '/api/files/sample.mp4',
    externalLink: '',
  });
  assert.equal(valid.valid, true);
});

test('computeDashboardStats computes totals and class/category distributions accurately', () => {
  const students: StudentRecord[] = [
    { id: '1', nis: '1001', fullName: 'Raka', className: 'XI Animasi 1', createdAt: '', updatedAt: '' },
    { id: '2', nis: '1002', fullName: 'Sinta', className: 'XI Animasi 1', createdAt: '', updatedAt: '' },
  ];
  const groups: StudentGroup[] = [
    { id: 'g1', name: 'Tim Alpha', className: 'XI Animasi 1', leaderName: 'Raka', members: ['Raka', 'Sinta'], createdAt: '', updatedAt: '' },
  ];
  const submissions: Submission[] = [
    {
      id: 'sub1',
      trackingCode: 'ANM-2026-AAAAA',
      groupName: 'Tim Alpha',
      leaderName: 'Raka',
      members: ['Raka', 'Sinta'],
      className: 'XI Animasi 1',
      title: 'Lentera',
      category: '2D',
      description: 'Deskripsi lengkap animasi.',
      fileUrl: '/api/files/a.mp4',
      fileName: 'a.mp4',
      fileType: 'video/mp4',
      fileSize: 1024,
      externalLink: '',
      status: 'Selesai',
      score: 92,
      revisionNote: 'Bagus',
      isPublished: true,
      publishedWorkId: 'w1',
      submitterUid: '',
      submittedAt: '',
      updatedAt: '',
    },
    {
      id: 'sub2',
      trackingCode: 'ANM-2026-BBBBB',
      groupName: 'Tim Beta',
      leaderName: 'Budi',
      members: ['Budi'],
      className: 'XII Animasi 1',
      title: 'Mecha',
      category: '3D',
      description: 'Render Blender 3D.',
      fileUrl: '/api/files/b.blend',
      fileName: 'b.blend',
      fileType: 'application/octet-stream',
      fileSize: 2048,
      externalLink: '',
      status: 'Menunggu',
      score: null,
      revisionNote: '',
      isPublished: false,
      publishedWorkId: '',
      submitterUid: '',
      submittedAt: '',
      updatedAt: '',
    },
  ];
  const publishedWorks: PublishedWork[] = [
    {
      id: 'w1',
      submissionId: 'sub1',
      title: 'Lentera',
      groupName: 'Tim Alpha',
      leaderName: 'Raka',
      members: ['Raka', 'Sinta'],
      className: 'XI Animasi 1',
      category: '2D',
      description: 'Deskripsi lengkap animasi.',
      thumbnailUrl: '/src/assets/images/x.jpg',
      coverUrl: '',
      mediaType: 'image',
      mediaUrl: '/src/assets/images/x.jpg',
      externalLink: '',
      isVisible: true,
      isFeatured: true,
      publishedAt: '',
      updatedAt: '',
    },
  ];

  const stats = computeDashboardStats({ students, groups, submissions, publishedWorks });
  assert.equal(stats.totalStudents, 3);
  assert.equal(stats.totalGroups, 2);
  assert.equal(stats.totalSubmissions, 2);
  assert.equal(stats.gradedSubmissions, 1);
  assert.equal(stats.pendingSubmissions, 1);
  assert.equal(stats.publishedWorks, 1);
  assert.equal(stats.byClass.length, 2);
  assert.equal(stats.byCategory.length, 2);
});

test('formatFileSize and buildWhatsAppShareUrl return expected formats', () => {
  assert.equal(formatFileSize(1536), '1.5 KB');
  const wa = buildWhatsAppShareUrl(
    { id: 'w1', title: 'Lentera', groupName: 'Tim A', className: 'XI Animasi 1', category: '2D' },
    'https://example.com'
  );
  assert.ok(wa.startsWith('https://wa.me/?text='));
  assert.ok(wa.includes('Lentera'));
});
