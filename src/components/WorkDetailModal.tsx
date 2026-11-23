import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Film, Share2, Users, X } from 'lucide-react';
import type { PublishedWork } from '../types';
import {
  buildWhatsAppShareUrl,
  formatIndonesianDate,
  isValidHttpUrl,
  parseYouTubeEmbedUrl,
} from '../utils/validation';

interface WorkDetailModalProps {
  work: PublishedWork | null;
  onClose: () => void;
}

export const WorkDetailModal: React.FC<WorkDetailModalProps> = ({ work, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    setCopied(false);
  }, [work?.id]);

  useEffect(() => {
    if (!work) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [work, onClose]);

  if (!work) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/?karya=${encodeURIComponent(work.id)}`;
  const waHref = buildWhatsAppShareUrl(work, origin);
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    `Karya Animasi "${work.title}" oleh ${work.groupName} (${work.className})`
  )}&url=${encodeURIComponent(shareUrl)}`;

  const youtubeEmbed = work.externalLink ? parseYouTubeEmbedUrl(work.externalLink) : null;
  const isVideoFile =
    work.mediaType === 'video' ||
    /\.(mp4|mov|webm)$/i.test(work.mediaUrl || '');
  const displayCover = work.coverUrl || work.thumbnailUrl;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard blocked
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="work-detail-title"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-white rounded-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
          <div className="min-w-0">
            <p className="text-xs font-medium text-indigo-700 truncate">
              {work.category} <span aria-hidden="true">·</span> {work.className}{' '}
              <span aria-hidden="true">·</span> {formatIndonesianDate(work.publishedAt)}
            </p>
            <h2
              id="work-detail-title"
              className="font-display text-lg sm:text-xl font-bold text-slate-900 truncate"
            >
              {work.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail karya"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Media Viewer */}
          <div className="lg:col-span-7 bg-slate-950 flex items-center justify-center min-h-[280px] sm:min-h-[400px]">
            {youtubeEmbed ? (
              <iframe
                src={youtubeEmbed}
                title={work.title}
                className="w-full aspect-video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : isVideoFile && work.mediaUrl ? (
              <video
                src={work.mediaUrl}
                controls
                poster={displayCover}
                className="w-full max-h-[500px] object-contain"
              />
            ) : !imgError && displayCover ? (
              <img
                src={displayCover}
                alt={work.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full max-h-[520px] object-contain"
              />
            ) : (
              <div className="p-10 text-center text-slate-300 flex flex-col items-center gap-3">
                <Film className="w-10 h-10 text-indigo-400" />
                <p className="text-sm font-medium">{work.title}</p>
              </div>
            )}
          </div>

          {/* Metadata & Share */}
          <div className="lg:col-span-5 p-6 space-y-6 bg-white">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-2">Deskripsi Karya</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {work.description}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-indigo-700 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Kelompok &amp; Ketua</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {work.groupName} — Ketua: {work.leaderName}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Anggota Tim</p>
                <p className="text-sm text-slate-700">
                  {work.members.join(' · ')}
                </p>
              </div>
            </div>

            {work.externalLink && isValidHttpUrl(work.externalLink) && (
              <div className="pt-4 border-t border-slate-100">
                <a
                  href={work.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Tautan Google Drive / YouTube
                </a>
              </div>
            )}

            {/* Social Share */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Share2 className="w-4 h-4 text-indigo-700" />
                Bagikan Karya
              </div>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors text-center whitespace-nowrap"
                >
                  WhatsApp
                </a>
                <a
                  href={fbHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors text-center whitespace-nowrap"
                >
                  Facebook
                </a>
                <a
                  href={xHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors text-center whitespace-nowrap"
                >
                  X / Twitter
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Salin Tautan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
