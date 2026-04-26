// MediaMessage — renders a message's media based on its type.
// Handles: image (with lightbox), video (inline player), audio (player),
//          file (download card), and URL links inside text.

import { useState } from "react";
import { formatFileSize } from "../../firebase/storageService";

// ── URL detection helper ──────────────────────────────────────────────────────
const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^[\]`]+/g;

export const renderTextWithLinks = (text) => {
  if (!text) return null;
  const parts = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(URL_REGEX.source, "g");

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <a
        key={`u${match.index}`}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 break-all opacity-90 hover:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        {match[0]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={`t${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }
  return parts.length > 0 ? parts : text;
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
const Lightbox = ({ src, alt, onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <button
      onClick={onClose}
      className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
    <img
      src={src}
      alt={alt}
      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

// ── File type icons ───────────────────────────────────────────────────────────
const FileIcon = ({ ext }) => {
  const iconMap = {
    pdf: { color: "text-red-500", char: "PDF" },
    doc: { color: "text-blue-500", char: "DOC" },
    docx: { color: "text-blue-500", char: "DOC" },
    xls: { color: "text-green-500", char: "XLS" },
    xlsx: { color: "text-green-500", char: "XLS" },
    ppt: { color: "text-orange-500", char: "PPT" },
    pptx: { color: "text-orange-500", char: "PPT" },
    zip: { color: "text-yellow-500", char: "ZIP" },
    rar: { color: "text-yellow-500", char: "RAR" },
    mp3: { color: "text-purple-500", char: "MP3" },
    wav: { color: "text-purple-500", char: "WAV" },
    mp4: { color: "text-pink-500", char: "MP4" },
  };
  const icon = iconMap[ext?.toLowerCase()] ?? { color: "text-muted-foreground", char: "FILE" };
  return (
    <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0`}>
      <span className={`text-[9px] font-black ${icon.color}`}>{icon.char}</span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const MediaMessage = ({ message, isOwn }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { mediaURL, mediaType, fileName, fileSize, text } = message;
  const ext = fileName?.split(".").pop();

  return (
    <div className="space-y-1.5 max-w-xs">
      {/* ── Image ── */}
      {mediaType === "image" && (
        <>
          <div
            className="relative rounded-xl overflow-hidden cursor-zoom-in group"
            onClick={() => setLightboxOpen(true)}
          >
            <img
              src={mediaURL}
              alt={fileName ?? "Image"}
              className="w-full max-h-64 object-cover rounded-xl transition-opacity group-hover:opacity-90"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-black/40 rounded-full p-2">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35M11 8v6M8 11h6"/>
                </svg>
              </div>
            </div>
          </div>
          {lightboxOpen && <Lightbox src={mediaURL} alt={fileName} onClose={() => setLightboxOpen(false)} />}
        </>
      )}

      {/* ── Video ── */}
      {mediaType === "video" && (
        <div className="rounded-xl overflow-hidden bg-black">
          <video
            src={mediaURL}
            controls
            className="w-full max-h-64 rounded-xl"
            preload="metadata"
          />
        </div>
      )}

      {/* ── Audio ── */}
      {mediaType === "audio" && (
        <div className={`flex flex-col gap-1.5 p-3 rounded-xl ${isOwn ? "bg-primary/20" : "bg-muted"}`}>
          <p className="text-xs font-medium text-foreground truncate">{fileName ?? "Audio"}</p>
          <audio src={mediaURL} controls className="w-full h-8 rounded-lg" preload="metadata" />
          {fileSize && <p className="text-[10px] text-muted-foreground">{formatFileSize(fileSize)}</p>}
        </div>
      )}

      {/* ── File (download card) ── */}
      {mediaType === "file" && (
        <a
          href={mediaURL}
          target="_blank"
          rel="noopener noreferrer"
          download={fileName}
          className={`flex items-center gap-3 p-3 rounded-xl transition-opacity hover:opacity-80
            ${isOwn ? "bg-white/10" : "bg-muted"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <FileIcon ext={ext} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{fileName ?? "File"}</p>
            <p className="text-[10px] text-muted-foreground">{formatFileSize(fileSize)}</p>
          </div>
          {/* Download icon */}
          <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
        </a>
      )}

      {/* ── Text (with URL detection) ── */}
      {text && (
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
          {renderTextWithLinks(text)}
        </p>
      )}
    </div>
  );
};

export default MediaMessage;
