import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser } from "../../features/auth/authSlice";
import { updateDisplayName } from "../../features/auth/authSlice";
import { useProfilePics } from "../../contexts/ProfileContext";
import { updateUserDisplayName } from "../../firebase/userService";

const ProfileDrawer = ({ onClose }) => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const { photoURLs, setPhoto, removePhoto } = useProfilePics();

  const currentPhoto = photoURLs[currentUser?.uid] || null;
  const [name, setName] = useState(currentUser?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const initials = (n) =>
    n?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhoto(currentUser.uid, ev.target.result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { setError("Name cannot be empty."); return; }
    setSaving(true);
    setError(null);
    try {
      await updateUserDisplayName(currentUser.uid, trimmed);
      dispatch(updateDisplayName(trimmed));
      onClose();
    } catch (err) {
      console.error("[ProfileDrawer] save failed:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-foreground">Your profile</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative group">
            <button onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary/30 hover:ring-primary transition-all focus:outline-none">
              {currentPhoto ? (
                <img src={currentPhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{initials(name || currentUser?.displayName)}</span>
                </div>
              )}
            </button>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          {currentPhoto && (
            <button onClick={() => removePhoto(currentUser.uid)}
              className="mt-2 text-xs text-destructive hover:underline">
              Remove photo
            </button>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          <p className="text-xs text-muted-foreground mt-2">Click to change profile picture</p>
        </div>

        {/* Name field */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Display name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            placeholder="Your name"
            className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
          <p className="text-sm text-foreground px-1">{currentUser?.email}</p>
        </div>

        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        <button onClick={handleSave} disabled={saving}
          className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-all">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
};

export default ProfileDrawer;
