"use client";

import { useRef, useState } from "react";
import { User, Shield, Calendar, Camera, Activity, Mail, Loader2 } from "lucide-react";

interface Props {
  name: string;
  email: string;
  avatar: string | null;
  role: "MEMBER" | "ADMIN" | "OWNER";
  createdAt: string;
  attendanceCount: number;
  bookingCount: number;
  onAvatarChange?: (avatarDataUrl: string) => Promise<boolean>;
}

const roleColors: Record<Props["role"], { bg: string; text: string; label: string }> = {
  MEMBER: { bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", label: "Membre" },
  ADMIN: { bg: "bg-purple-500/10", text: "text-purple-600 dark:text-purple-400", label: "Administrateur" },
  OWNER: { bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", label: "Propriétaire" },
};

export default function ProfileAvatar({
  name,
  email,
  avatar,
  role,
  createdAt,
  attendanceCount,
  bookingCount,
  onAvatarChange,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const roleInfo = roleColors[role];

  const handleImageError = () => {
    setImageError(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onAvatarChange) return;

    if (!file.type.startsWith("image/")) {
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      // Upload the actual file to Cloudinary via /api/upload (already
      // handles auth, MIME validation, and size limits server-side) and
      // store the returned CDN URL, rather than reading the file as a
      // base64 data: URL and writing that multi-MB string directly into
      // the users table. That path worked but doesn't scale — every
      // profile fetch would ship the raw image bytes inline, and nothing
      // resizes or CDN-caches it.
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok || !uploadData?.url) {
        throw new Error(uploadData?.error || "upload failed");
      }

      await onAvatarChange(uploadData.url);
    } catch {
      // onAvatarChange's caller already surfaces a toast on failure for
      // the profile-save step; a failed /api/upload call itself has no
      // caller-visible error path today, so at minimum don't leave the
      // UI stuck spinning silently.
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center text-center transition-all hover:shadow-md">
      {/* Avatar */}
      <div className="relative group">
        <div className={`w-24 h-24 rounded-full ${!avatar || imageError ? 'bg-primary/10' : ''} flex items-center justify-center overflow-hidden ring-4 ring-border transition-all group-hover:ring-primary/20`}>
          {isUploading ? (
            <Loader2 size={24} className="animate-spin text-primary" />
          ) : avatar && !imageError ? (
            <img 
              src={avatar} 
              alt={name} 
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <User size={36} className="text-primary" />
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-1.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-colors"
          aria-label="Changer la photo de profil"
        >
          <Camera size={14} />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      <h2 className="mt-4 text-xl font-bold text-primary">{name}</h2>
      <p className="text-sm text-muted flex items-center gap-1.5 mt-0.5">
        <Mail size={14} />
        {email}
      </p>

      <span className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${roleInfo.bg} ${roleInfo.text} text-xs font-semibold`}>
        <Shield size={12} />
        {roleInfo.label}
      </span>

      <p className="mt-3 text-xs text-muted flex items-center gap-1.5">
        <Calendar size={12} />
        Membre depuis{" "}
        {new Date(createdAt).toLocaleDateString("fr-FR", {
          month: "long",
          year: "numeric",
        })}
      </p>

      {/* Stats */}
      <div className="mt-5 w-full border-t border-border pt-5">
        <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5 justify-center">
          <Activity size={12} />
          Statistiques
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted rounded-xl p-3 transition-all hover:bg-muted/70">
            <p className="text-2xl font-bold text-primary">{attendanceCount}</p>
            <p className="text-xs text-muted mt-0.5">Présences</p>
          </div>
          <div className="bg-muted rounded-xl p-3 transition-all hover:bg-muted/70">
            <p className="text-2xl font-bold text-primary">{bookingCount}</p>
            <p className="text-xs text-muted mt-0.5">Réservations</p>
          </div>
        </div>
      </div>
    </div>
  );
}