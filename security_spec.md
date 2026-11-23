# Security Specification & Invariants — GALERI KARYA SISWA SMK ANIMASI

## 1. Data Invariants
1. A newly submitted student assignment (`submissions/{id}`) must start with `status == 'Menunggu'`, `score == null`, `isPublished == false`, `publishedWorkId == ''`, and `revisionNote == ''`.
2. Only verified `ADMIN` (`feri.smkn4madiun@gmail.com` or `users/{uid}.role == 'ADMIN'`) or authorized `GURU` (`users/{uid}.role == 'GURU'` or matching `staff_invites`) may grade, edit, delete, or publish student assignments.
3. Students and unauthenticated guests cannot list `submissions`, `students`, `groups`, or `submission_statuses` to prevent PII/file enumeration.
4. `published_works` documents with `isVisible == false` are hidden from public reads (`get`/`list`) and accessible only to `GURU` or `ADMIN`.
5. Users cannot self-assign `ADMIN` or `GURU` role on `users/{uid}` creation or update unless backed by the bootstrapped admin email or an existing `staff_invites` record.

## 2. Dirty Dozen Payloads (Must Return PERMISSION_DENIED)
1. **Self-Approve Submission**: Unauthenticated/student `create` on `/submissions/{id}` with `status: 'Diterima'` and `isPublished: true`.
2. **Self-Score Injection**: Student `create` on `/submissions/{id}` with `score: 100`.
3. **Ghost Field Shadow Write**: Any `create` on `/submissions/{id}` containing extra key `adminBypass: true`.
4. **Privilege Escalation on User Profile**: Authenticated `SISWA` creating `/users/{uid}` with `role: 'ADMIN'`.
5. **Role Mutation on Update**: Authenticated `SISWA` updating `/users/{uid}` to change `role` from `'SISWA'` to `'GURU'`.
6. **Unauthorized Submission Listing**: Unauthenticated or non-owner `list` query on `/submissions`.
7. **Unauthorized Status Enumeration**: Unauthenticated `list` query on `/submission_statuses`.
8. **Hidden Gallery Scraping**: Public `get` or `list` on `/published_works/{id}` where `isVisible == false`.
9. **Unverified Admin Email Spoof**: Request with matching email in token where `email_verified == false`.
10. **ID Poisoning**: Document `create` with a 200-character invalid ID containing `/$#` characters.
11. **Oversized String Resource Poisoning**: `create` on `/submissions/{id}` with `title` exceeding 160 chars or `description` exceeding 2000 chars.
12. **Unauthorized Student PII Read**: Student or unauthenticated user attempting `get` or `list` on `/students` or `/groups`.
