import { createContext, useContext, useState } from "react";

const ProfileContext = createContext(null);

export const ProfileProvider = ({ children }) => {
  const [photoURLs, setPhotoURLs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pingora_profilePics") || "{}");
    } catch {
      return {};
    }
  });

  const setPhoto = (uid, dataUrl) => {
    const updated = { ...photoURLs, [uid]: dataUrl };
    localStorage.setItem("pingora_profilePics", JSON.stringify(updated));
    setPhotoURLs(updated);
  };

  const removePhoto = (uid) => {
    const updated = { ...photoURLs };
    delete updated[uid];
    localStorage.setItem("pingora_profilePics", JSON.stringify(updated));
    setPhotoURLs(updated);
  };

  return (
    <ProfileContext.Provider value={{ photoURLs, setPhoto, removePhoto }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfilePics = () => useContext(ProfileContext);
