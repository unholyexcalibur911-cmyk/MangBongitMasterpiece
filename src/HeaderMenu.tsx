import React, { useState, useRef, useEffect } from "react";
import styles from "./HeaderMenu.module.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const fetchProfile = async () => {
  const token = localStorage.getItem("authToken");
  const res = await fetch("/api/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

const updateProfile = async (updates: { name?: string; avatarUrl?: string }) => {
  const token = localStorage.getItem("authToken");
  const res = await fetch("/api/users/me", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
};

const uploadAvatar = async (file: File) => {
  const token = localStorage.getItem("authToken");
  const formData = new FormData();
  formData.append("avatar", file);
  const res = await fetch("/api/users/me/avatar", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload avatar");
  return res.json();
};

const HeaderMenu: React.FC<{
  onProfileClick?: () => void;
  onAdminClick?: () => void;
  onTeamsClick?: () => void;
  onAboutClick?: () => void;
  onHomeClick?: () => void;
  onServicesClick?: () => void;
  onContactClick?: () => void;
}> = ({
  onProfileClick,
  onAdminClick,
  onTeamsClick,
  onAboutClick,
  onServicesClick,
  onContactClick,
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const queryClient = useQueryClient();

  // React Query: fetch profile
  const { data: me, refetch: refetchProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  // React Query: update profile
  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setEditing(false);
    },
  });

  // React Query: upload avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onMutate: () => setAvatarLoading(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setAvatarLoading(false);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    },
    onError: () => setAvatarLoading(false),
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync name input with profile data
  useEffect(() => {
    setNameInput(me?.name || "");
  }, [me?.name]);

  // Listen for profileUpdated event
  useEffect(() => {
    const handleProfileUpdate = () => {
      setAvatarLoading(true);
      refetchProfile().finally(() => setAvatarLoading(false));
    };
    window.addEventListener("profileUpdated", handleProfileUpdate);
    return () =>
      window.removeEventListener("profileUpdated", handleProfileUpdate);
  }, [refetchProfile]);


  function saveProfile() {
    updateProfileMutation.mutate({ name: nameInput });
  }

  function logout() {
    localStorage.removeItem("authToken");
    window.location.reload();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAvatarMutation.mutate(file);
  }

  return (
    <div className={styles.header}>
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>📋</span>
          <span className={styles.logoText}>AyaSync</span>
        </div>
      </div>
      <div className={styles.centerSection}></div>
      <div className={styles.rightSection}>
        <div className={styles.userInfo}>
          <span className={styles.username}>{me?.name || me?.email || "User"}</span>
        </div>
        <button className={styles.signOutButton} onClick={logout}>
          Sign Out
        </button>
        <div className={styles.profileWrapper} ref={dropdownRef}>
          <button
            className={`${styles.profileButton} ${open ? styles.active : ""}`}
            onClick={() => setOpen(!open)}
          >
            <div className={styles.profileAvatar}>
              {me?.avatarUrl ? (
                <img
                  src={me.avatarUrl}
                  alt="Profile"
                  className={styles.avatarImage}
                />
              ) : (
                <span className={styles.avatarIcon}>👤</span>
              )}
              <label className={styles.avatarUploadBtn}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleAvatarChange}
                  disabled={avatarLoading}
                />
                <span>{avatarLoading ? "Uploading..." : "Change Avatar"}</span>
              </label>
            </div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{me?.name || "User"}</span>
              <span className={styles.profileEmail}>{me?.email}</span>
            </div>
            <div className={styles.dropdownArrow}>
              <span className={`${styles.arrow} ${open ? styles.arrowUp : ""}`}>▼</span>
            </div>
          </button>
          {/* Settings Dropdown */}
          {open && (
            <div className={styles.dropdown}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onProfileClick?.();
                  setOpen(false);
                }}
              >
                <span>⚙️</span> Profile Settings
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onTeamsClick?.();
                  setOpen(false);
                }}
              >
                <span>👥</span> Team Management
              </a>
              {me?.role === "admin" && (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onAdminClick?.();
                    setOpen(false);
                  }}
                >
                  <span>🔐</span> Admin Dashboard
                </a>
              )}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onAboutClick?.();
                  setOpen(false);
                }}
              >
                <span>ℹ️</span> About
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onServicesClick?.();
                  setOpen(false);
                }}
              >
                <span>🛠️</span> Services
              </a>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onContactClick?.();
                  setOpen(false);
                }}
              >
                <span>📧</span> Contact
              </a>
            </div>
          )}
        </div>
        <a href="#" className={styles.link}></a>
      </div>
      {editing && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 12,
              width: 360,
              border: "2px solid #0e3ca8",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Edit Profile</h3>
            <label>Name</label>
            <input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              style={{
                width: "100%",
                marginBottom: 12,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #cbd5e1",
              }}
            />
            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button className={styles.link} onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button className={styles.link} onClick={saveProfile}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderMenu;
