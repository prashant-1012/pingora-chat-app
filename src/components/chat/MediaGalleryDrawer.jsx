// MediaGalleryDrawer — right-side slide-in panel showing all shared media.
// Tabs: All | Images | Videos | Audio | Files

import { useState } from "react";
import { useSelector } from "react-redux";
import { selectMediaMessages } from "../../features/chat/chatSlice";
import { selectUserCache } from "../../features/chat/chatSlice";
import { formatFileSize } from "../../firebase/storageService";

const TABS = ["All", "Images", "Videos", "Audio", "Files"];

const typeFilter = {
  All: () => true,
  Images: (m) => m.mediaType === "image",
  Videos: (m) => m.mediaType === "video",
  Audio: (m) => m.mediaType === "audio",
  Files: (m) => m.mediaType === "file",
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
};

// ── Lightbox (same simple impl as in MediaMessage) ────────────────────────────
const Lightbox = ({ src, onClose }) => (
  <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 text-white hover:bg-white/20">
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
  </div>
);

const MediaGalleryDrawer = ({ onClose }) => {
  const messages = useSelector(selectMediaMessages);
  const userCache = useSelector(selectUserCache);
  const [activeTab, setActiveTab] = useState("All");
  const [lightbox, setLightbox] = useState(null); // URL string

  const filtered = messages.filter(typeFilter[activeTab]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 z-50 w-80 bg-card border-l border-border flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Shared media</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{messages.length} item{messages.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-3 py-2 border-b border-border shrink-0 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                ${activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <p className="text-sm text-muted-foreground">No {activeTab.toLowerCase()} shared yet</p>
            </div>
          ) : activeTab === "Images" || (activeTab === "All" && filtered.some((m) => m.mediaType === "image")) ? (
            // ── Images: 3-column grid ──
            <div className="p-3">
              {activeTab === "Images" ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {filtered.map((m) => (
                    <div
                      key={m.id}
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => setLightbox(m.mediaURL)}
                    >
                      <img src={m.mediaURL} alt={m.fileName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                    </div>
                  ))}
                </div>
              ) : (
                // All tab — show sections
                <div className="space-y-4">
                  {/* Images grid */}
                  {filtered.filter((m) => m.mediaType === "image").length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Images</p>
                      <div className="grid grid-cols-3 gap-1.5">
                        {filtered.filter((m) => m.mediaType === "image").map((m) => (
                          <div key={m.id} className="aspect-square rounded-lg overflow-hidden cursor-pointer" onClick={() => setLightbox(m.mediaURL)}>
                            <img src={m.mediaURL} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Non-image list */}
                  {filtered.filter((m) => m.mediaType !== "image").map((m) => (
                    <GalleryListItem key={m.id} message={m} userCache={userCache} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // ── List view for videos, audio, files ──
            <div className="p-3 space-y-2">
              {filtered.map((m) => (
                <GalleryListItem key={m.id} message={m} userCache={userCache} />
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
    </>
  );
};

// ── Gallery list item (video / audio / file) ──────────────────────────────────
const GalleryListItem = ({ message, userCache }) => {
  const { mediaURL, mediaType, fileName, fileSize, senderId, sentAt } = message;
  const sender = userCache[senderId];
  const icons = { video: "🎥", audio: "🎵", file: "📎" };

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
      {/* Icon or video thumbnail */}
      {mediaType === "video" ? (
        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0 overflow-hidden">
          <video src={mediaURL} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-lg">
          {icons[mediaType] ?? "📎"}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{fileName ?? mediaType}</p>
        <p className="text-[10px] text-muted-foreground">
          {sender?.displayName ?? "Unknown"} · {formatDate(sentAt)}
          {fileSize ? ` · ${formatFileSize(fileSize)}` : ""}
        </p>
      </div>

      <a
        href={mediaURL}
        target="_blank"
        rel="noopener noreferrer"
        download={fileName}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        title="Download"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
      </a>
    </div>
  );
};

export default MediaGalleryDrawer;
