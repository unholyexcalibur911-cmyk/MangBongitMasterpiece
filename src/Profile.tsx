import React, { useState, useEffect } from "react";
import styles from "./Profile.module.css";
import { globalActivityTracker } from "./globalActivityTracker";

interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  role: "user" | "admin";
  isActive: boolean;
  lastLogin?: string;
}

interface Connection {
  id: string;
  userId: string;
  connectedUserId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

const Profile: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [user, setUser] = useState<User | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddConnection, setShowAddConnection] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
  });
  const [imageDimensions, setImageDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [aspectRatio, setAspectRatio] = useState<
    "square" | "circle" | "rectangle"
  >("square");
  const [activeFilter, setActiveFilter] = useState<string>("none");

  useEffect(() => {
    loadProfile();
    loadConnections();
    loadAllUsers();
  }, []);

  // Helper function to make authenticated API calls with JSON data.
  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const token = localStorage.getItem("authToken");
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    headers.set("Content-Type", "application/json");
    const res = await fetch(input, { ...init, headers });
    return res;
  }

  // (Removed unused authUpload function)

  // Fetches the current user's profile data from the backend.
  async function loadProfile() {
    try {
      const res = await authFetch("/api/users/me");
      const data = await res.json();
      if (res.ok) {
        setUser(data);
      }
    } catch (e) {
      setError("Failed to load profile.");
    }
  }

  // Fetches the user's connections.
  async function loadConnections() {
    try {
      const res = await authFetch("/api/users/connections");
      const data = await res.json();
      if (res.ok) {
        setConnections(data);
      }
    } catch (e) {
      setError("Failed to load connections.");
    }
  }

  // Fetches a list of all users in the system for the "Add Connection" feature.
  async function loadAllUsers() {
    try {
      const res = await authFetch("/api/users");
      const data = await res.json();
      if (res.ok) {
        setAllUsers(data);
      }
    } catch (e) {
      setError("Failed to load users.");
    }
  }

  // Sends a PATCH request to update the user's profile with text-based data.
  async function updateProfile(updates: Partial<User>) {
    try {
      setLoading(true);
      const res = await authFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);

        // Track activity
        const updatedFields = Object.keys(updates).join(", ");
        globalActivityTracker.trackActivity({
          action: `Updated profile: ${updatedFields}`,
          user: data.email || "Unknown",
          details: `Profile fields updated: ${updatedFields}`,
          type: "profile",
        });

        // Trigger profile update event for other components
        window.dispatchEvent(new CustomEvent("profileUpdated"));
      } else {
        // Try to parse error JSON, but handle cases where it's not JSON
        const errorText = await res.text();
        try {
          const errorData = JSON.parse(errorText);
          setError(
            errorData?.error ||
              `Failed to update profile. Status: ${res.status}`
          );
        } catch {
          setError(
            `Failed to update profile. Server returned a non-JSON response: ${res.status} ${res.statusText}`
          );
        }
      }
    } catch (e) {
      setError("Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  // Sends a POST request to create a new connection request.
  async function sendConnectionRequest(userId: string) {
    try {
      const res = await authFetch("/api/users/connections", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        loadConnections();
        setShowAddConnection(false);
        setSearchEmail("");

        // Track activity
        const targetUser = allUsers.find((u) => u.id === userId);
        globalActivityTracker.trackActivity({
          action: `Sent connection request to ${
            targetUser?.email || "Unknown User"
          }`,
          user: user?.email || "Unknown",
          target: targetUser?.email,
          details: `Connection request sent`,
          type: "connection",
        });
      }
    } catch (e) {
      setError("Failed to send connection request");
    }
  }

  // Responds to a pending connection request (accepts or declines).
  async function respondToConnection(
    connectionId: string,
    status: "accepted" | "declined"
  ) {
    try {
      const res = await authFetch(`/api/users/connections/${connectionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadConnections();

        // Track activity
        const connection = connections.find((c) => c.id === connectionId);
        const targetUser = allUsers.find(
          (u) => u.id === connection?.connectedUserId
        );
        globalActivityTracker.trackActivity({
          action: `${
            status === "accepted" ? "Accepted" : "Declined"
          } connection request from ${targetUser?.email || "Unknown User"}`,
          user: user?.email || "Unknown",
          target: targetUser?.email,
          details: `Connection ${status}`,
          type: "connection",
        });
      }
    } catch (e) {
      setError("Failed to respond to connection");
    }
  }

  // Removes an existing connection.
  async function removeConnection(connectionId: string) {
    try {
      const res = await authFetch(`/api/users/connections/${connectionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadConnections();

        // Track activity
        const connection = connections.find((c) => c.id === connectionId);
        const targetUser = allUsers.find(
          (u) => u.id === connection?.connectedUserId
        );
        globalActivityTracker.trackActivity({
          action: `Removed connection with ${
            targetUser?.email || "Unknown User"
          }`,
          user: user?.email || "Unknown",
          target: targetUser?.email,
          details: `Connection removed`,
          type: "connection",
        });
      }
    } catch (e) {
      setError("Failed to remove connection");
    }
  }

  // This function is the entry point for processing a selected image file.
  const handleFileSelect = (file: File | null | undefined) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024;
    // Validate file size to be under 5MB.
    if (file.size > maxSize) {
      setError(
        `File size must be less than 5MB. Your file is ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB`
      );
      setSelectedFile(null); // Clear the invalid file
      setShowUploadModal(false); // Close the modal
      return;
    }

    // Validate the file type to ensure it's a common image format.
    const validImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
      "image/bmp",
      "image/tiff",
      "image/ico",
    ];

    if (!validImageTypes.includes(file.type.toLowerCase())) {
      setError(
        "Please select a valid image file (JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO)"
      );
      return;
    }

    // If validation passes, reset errors and set the selected file.
    setError(null);
    setIsDragging(false);
    setSelectedFile(file);

    // Use FileReader to read the image file as a base64 data URL.
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setCropImage(imageUrl);
      setShowUploadModal(true); // Open the modal once the image is loaded
    };
    reader.onerror = () => {
      setIsDragging(false);
      setError("Failed to read the image file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  // Handles the file selection from the native file input.
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(event.target.files?.[0]);
  };

  // Handles files being dropped into the drag-and-drop area.
  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    handleFileSelect(file);
    event.dataTransfer.clearData(); // Clean up to allow for re-dropping the same file
  };

  // Handles the visual state change when a file is dragged over the drop zone.
  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  // This function is called when the user clicks "Apply & Save" in the editor modal.
  const handleCropConfirm = () => {
    if (!cropImage) return;

    setIsUploading(true);
    setUploadProgress(0);

    const canvas = document.createElement("canvas");
    // The offscreen canvas where the final, edited image will be drawn.
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Set canvas size based on aspect ratio
      canvas.width = aspectRatio === "rectangle" ? 400 : 200;
      canvas.height = aspectRatio === "rectangle" ? 300 : 200;

      if (!ctx) {
        setError("Could not process image. Canvas context is not available.");
        setIsUploading(false);
        return;
      }

      // Prepare canvas for transformations
      // Prepare the canvas for all transformations (zoom, rotation).
      ctx.save();
      // Apply transformations in the correct order: translate, rotate, scale
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom / 100, zoom / 100);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Apply brightness and contrast adjustments.
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // Calculate the scale factor between displayed image and actual image
      // Calculate the scale factor between the displayed image and the original, full-sized image.
      const scaleX = img.naturalWidth / imageDimensions.width;
      const scaleY = img.naturalHeight / imageDimensions.height;

      // Define the source rectangle on the original, full-sized image
      // Define the source rectangle (the crop area) on the original, full-sized image.
      const sourceX = cropData.x * scaleX;
      const sourceY = cropData.y * scaleY;
      const sourceWidth = cropData.width * scaleX;
      const sourceHeight = cropData.height * scaleY;

      // Draw the cropped and transformed portion of the image onto the canvas
      // Draw the cropped and transformed portion of the original image onto the final canvas.
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      ctx.restore(); // Restore canvas state after drawing

      // Apply additional filters
      // Apply additional cosmetic filters like sepia or grayscale.
      if (activeFilter !== "none") {
        applyFilter(ctx, canvas, activeFilter);
      }

      // Convert canvas to a base64 data URL. Use JPEG with quality compression
      // to reduce payload size and avoid a "413 Payload Too Large" error.
      const croppedImageUrl = canvas.toDataURL("image/jpeg", 0.85);

      // Update profile using the existing helper function that sends JSON.
      // Finally, call the updateProfile function, sending the base64 string in a JSON payload.
      updateProfile({ avatarUrl: croppedImageUrl }).finally(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setSelectedFile(null);
        setShowUploadModal(false);
        setCropImage(null);
        // Reset customization values
        setRotation(0);
        setBrightness(100);
        setContrast(100);
        setZoom(100);
        setAspectRatio("square");
        setActiveFilter("none");
      });

      // Trigger profile update event
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    };

    img.src = cropImage;
  };

  // Resets all state related to the image editor when the user cancels.
  const handleCropCancel = () => {
    setShowUploadModal(false);
    setCropImage(null);
    setIsDragging(false);
    setSelectedFile(null);
    // Reset customization values
    setRotation(0);
    setBrightness(100);
    setContrast(100);
    setZoom(100);
    handleAspectRatioChange("square");
    setActiveFilter("none");
  };

  // Apply image filters
  // A utility function to apply pixel-level manipulations for different filter effects.
  const applyFilter = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    filter: string
  ) => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    switch (filter) {
      case "grayscale":
        for (let i = 0; i < data.length; i += 4) {
          const gray =
            data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
      case "sepia":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        break;
      case "vintage":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.max(0, data[i + 2] * 0.9);
        }
        break;
      case "cool":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.max(0, data[i] * 0.9);
          data[i + 1] = Math.min(255, data[i + 1] * 1.1);
          data[i + 2] = Math.min(255, data[i + 2] * 1.1);
        }
        break;
      case "warm":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.min(255, data[i] * 1.1);
          data[i + 1] = Math.min(255, data[i + 1] * 1.05);
          data[i + 2] = Math.max(0, data[i + 2] * 0.9);
        }
        break;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // This function runs when the image first loads into the editor.
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const containerWidth = 400; // Max width of crop container
    const containerHeight = 400; // Max height of crop container

    // Calculate display dimensions
    // Calculate the display dimensions of the image to fit within the container.
    const aspectRatioValue = img.naturalWidth / img.naturalHeight;
    let displayWidth = containerWidth;
    let displayHeight = containerHeight;

    if (aspectRatioValue > 1) {
      // Landscape
      displayHeight = containerWidth / aspectRatioValue;
    } else {
      // Portrait or square
      displayWidth = containerHeight * aspectRatioValue;
    }

    setImageDimensions({ width: displayWidth, height: displayHeight });

    // Initialize crop area based on selected aspect ratio
    // Initialize the crop area to a sensible default size in the center of the image.
    let cropSize = Math.min(displayWidth, displayHeight) * 0.6; // 60% of smaller dimension
    let cropWidth = cropSize;
    let cropHeight = cropSize;

    if (aspectRatio === "rectangle") {
      cropSize = Math.min(displayWidth, displayHeight) * 0.8;
      cropWidth = cropSize * 1.5;
      cropHeight = cropSize;
    }

    // Ensure crop area doesn't exceed image bounds
    cropWidth = Math.min(cropWidth, displayWidth);
    cropHeight = Math.min(cropHeight, displayHeight);

    setCropData({
      x: Math.max(0, (displayWidth - cropWidth) / 2),
      y: Math.max(0, (displayHeight - cropHeight) / 2),
      width: cropWidth,
      height: cropHeight,
    });
  };

  // Handles the user changing the desired shape of the crop (square, circle, etc.).
  const handleAspectRatioChange = (
    newAspectRatio: "square" | "circle" | "rectangle"
  ) => {
    setAspectRatio(newAspectRatio);

    // Recalculate crop area when aspect ratio changes
    if (imageDimensions.width > 0 && imageDimensions.height > 0) {
      let cropSize =
        Math.min(imageDimensions.width, imageDimensions.height) * 0.6;
      let cropWidth = cropSize;
      let cropHeight = cropSize;

      if (newAspectRatio === "rectangle") {
        cropSize =
          Math.min(imageDimensions.width, imageDimensions.height) * 0.8;
        cropWidth = cropSize * 1.5;
        cropHeight = cropSize;
      }

      // Ensure crop area doesn't exceed image bounds
      cropWidth = Math.min(cropWidth, imageDimensions.width);
      cropHeight = Math.min(cropHeight, imageDimensions.height);

      setCropData((prev) => ({
        x: Math.max(0, Math.min(prev.x, imageDimensions.width - cropWidth)),
        y: Math.max(0, Math.min(prev.y, imageDimensions.height - cropHeight)),
        width: cropWidth,
        height: cropHeight,
      }));
    }
  };

  // Handles moving the crop box by clicking on the image.
  const handleCropMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!showUploadModal) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Update crop position (keep within bounds)
    setCropData((prev) => ({
      ...prev,
      x: Math.max(
        0,
        Math.min(x - prev.width / 2, imageDimensions.width - prev.width)
      ),
      y: Math.max(
        0,
        Math.min(y - prev.height / 2, imageDimensions.height - prev.height)
      ),
    }));
  };

  // Handles dragging the crop box to move it.
  const handleCropDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const container = e.currentTarget.parentElement;
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startCropX = cropData.x;
    const startCropY = cropData.y;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setCropData((prev) => ({
        ...prev,
        x: Math.max(
          0,
          Math.min(startCropX + deltaX, imageDimensions.width - prev.width)
        ),
        y: Math.max(
          0,
          Math.min(startCropY + deltaY, imageDimensions.height - prev.height)
        ),
      }));
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Handles resizing the crop box by dragging its corners.
  const handleCropResize = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: "nw" | "se"
  ) => {
    e.stopPropagation();
    const container = e.currentTarget.closest(
      ".cropImageContainer"
    ) as HTMLElement;
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startCropData = { ...cropData };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      setCropData((prev) => {
        const newData = { ...prev };

        if (direction === "nw") {
          // Resize from top-left corner
          newData.width = Math.max(50, startCropData.width - deltaX);
          newData.height = Math.max(50, startCropData.height - deltaY);
          newData.x = Math.max(
            0,
            Math.min(
              startCropData.x + deltaX,
              startCropData.x + startCropData.width - 50
            )
          );
          newData.y = Math.max(
            0,
            Math.min(
              startCropData.y + deltaY,
              startCropData.y + startCropData.height - 50
            )
          );
        } else {
          // Resize from bottom-right corner
          newData.width = Math.max(
            50,
            Math.min(
              startCropData.width + deltaX,
              imageDimensions.width - startCropData.x
            )
          );
          newData.height = Math.max(
            50,
            Math.min(
              startCropData.height + deltaY,
              imageDimensions.height - startCropData.y
            )
          );
        }

        return newData;
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Filters the list of all users to show potential new connections.
  const filteredUsers = allUsers.filter(
    (u) =>
      u.id !== user?.id &&
      !connections.some(
        (c) => c.connectedUserId === u.id || c.userId === u.id
      ) &&
      (searchEmail === "" ||
        u.email.toLowerCase().includes(searchEmail.toLowerCase()))
  );

  return (
    <div className={styles.profileContainer}>
      <div className={styles.header}>
        <button onClick={onBack} className={styles.backButton}>
          ← Back to Dashboard
        </button>
        <h1>Profile Settings</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.content}>
        {/* Profile Section */}
        <div className={styles.section}>
          <h2>Profile Information</h2>
          <div className={styles.profileCard}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarContainer}>
                <div className={styles.avatarWrapper}>
                  <img
                    src={user?.avatarUrl || "/default-avatar.svg"}
                    alt="Profile"
                    className={styles.avatar}
                    style={{
                      opacity: isUploading ? 0.7 : 1,
                      transition: "opacity 0.3s ease",
                    }}
                  />
                  {isUploading && (
                    <div className={styles.uploadOverlay}>
                      <div className={styles.uploadProgress}>
                        <div
                          className={styles.progressBar}
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <div className={styles.uploadText}>
                        {uploadProgress < 100
                          ? "Uploading..."
                          : "Processing..."}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.avatarUpload}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Change Avatar"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
                <div className={styles.uploadInfo}>
                  <small>
                    Supports: JPEG, PNG, GIF, WebP, SVG, BMP, TIFF, ICO
                  </small>
                  <small>Max size: 5MB</small>
                  {selectedFile && (
                    <div className={styles.fileInfo}>
                      <small style={{ color: "#0e3ca8", fontWeight: "600" }}>
                        Selected: {selectedFile.name}
                      </small>
                      <small style={{ color: "#6b7280" }}>
                        Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)}MB
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.field}>
                <label>Name</label>
                <input
                  type="text"
                  value={user?.name || ""}
                  onChange={(e) =>
                    setUser((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  onBlur={(e) => updateProfile({ name: e.target.value })}
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>

              <div className={styles.field}>
                <label>Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className={styles.disabled}
                />
              </div>

              <div className={styles.field}>
                <label>Role</label>
                <div
                  className={`${styles.roleDisplay} ${
                    styles[user?.role || "user"]
                  }`}
                >
                  <span className={styles.roleIcon}>
                    {user?.role === "admin" ? "👑" : "👤"}
                  </span>
                  <span className={styles.roleText}>
                    {user?.role === "admin" ? "Administrator" : "User"}
                  </span>
                </div>
              </div>

              <div className={styles.field}>
                <label>Account Status</label>
                <div
                  className={`${styles.statusDisplay} ${
                    user?.isActive ? styles.active : styles.inactive
                  }`}
                >
                  <span className={styles.statusIcon}>
                    {user?.isActive ? "✅" : "❌"}
                  </span>
                  <span className={styles.statusText}>
                    {user?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {user?.lastLogin && (
                <div className={styles.field}>
                  <label>Last Login</label>
                  <div className={styles.lastLoginDisplay}>
                    <span className={styles.lastLoginIcon}>🕒</span>
                    <span className={styles.lastLoginText}>
                      {new Date(user.lastLogin).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Connections Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Connections</h2>
            <button
              onClick={() => setShowAddConnection(!showAddConnection)}
              className={styles.addButton}
            >
              + Add Connection
            </button>
          </div>

          {showAddConnection && (
            <div className={styles.addConnection}>
              <h3>Find Users</h3>
              <input
                type="email"
                placeholder="Search by email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className={styles.searchInput}
              />

              <div className={styles.userList}>
                {filteredUsers.map((u) => (
                  <div key={u.id} className={styles.userItem}>
                    <div className={styles.userInfo}>
                      <img
                        src={u.avatarUrl || "/default-avatar.svg"}
                        alt="User"
                        className={styles.userAvatar}
                      />
                      <div>
                        <div className={styles.userName}>
                          {u.name || "Unnamed"}
                        </div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => sendConnectionRequest(u.id)}
                      className={styles.connectButton}
                    >
                      Connect
                    </button>
                  </div>
                ))}
                {filteredUsers.length === 0 && searchEmail && (
                  <div className={styles.noResults}>No users found</div>
                )}
              </div>
            </div>
          )}

          <div className={styles.connectionsList}>
            {connections.map((conn) => {
              const connectedUser = allUsers.find(
                (u) => u.id === conn.connectedUserId
              );
              if (!connectedUser) return null;

              return (
                <div key={conn.id} className={styles.connectionItem}>
                  <div className={styles.connectionInfo}>
                    <img
                      src={connectedUser.avatarUrl || "/default-avatar.svg"}
                      alt="User"
                      className={styles.connectionAvatar}
                    />
                    <div>
                      <div className={styles.connectionName}>
                        {connectedUser.name || "Unnamed"}
                      </div>
                      <div className={styles.connectionEmail}>
                        {connectedUser.email}
                      </div>
                      <div className={styles.connectionStatus}>
                        Status:{" "}
                        <span className={styles[conn.status]}>
                          {conn.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.connectionActions}>
                    {conn.status === "pending" && (
                      <>
                        {user?.id === conn.connectedUserId ? (
                          // You received the request → Approve or Cancel
                          <>
                            <button
                              onClick={() =>
                                respondToConnection(conn.id, "accepted")
                              }
                              className={styles.acceptButton}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                respondToConnection(conn.id, "declined")
                              }
                              className={styles.declineButton}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          // You sent the request → only Cancel
                          <button
                            onClick={() =>
                              respondToConnection(conn.id, "declined")
                            }
                            className={styles.declineButton}
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                    {conn.status === "accepted" && (
                      <button
                        onClick={() => removeConnection(conn.id)}
                        className={styles.removeButton}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {connections.length === 0 && (
              <div className={styles.noConnections}>
                No connections yet. Add some connections to collaborate!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Crop Modal */}
      {showUploadModal && (
        <div className={styles.cropModal}>
          <div className={styles.cropModalContent}>
            <h3>Customize Your Avatar</h3>

            {!cropImage ? (
              <div className={styles.uploadAreaContainer}>
                <label
                  className={`${styles.uploadDropZone} ${
                    isDragging ? styles.dragging : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className={styles.uploadIcon}>🖼️</div>
                  <div className={styles.uploadText}>
                    Drag & drop your image here
                  </div>
                  <div className={styles.uploadSubtext}>or click to browse</div>
                </label>
                <button
                  className={styles.cancelButton}
                  onClick={handleCropCancel}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <button
                  className={styles.backToSelectButton}
                  onClick={() => setCropImage(null)}
                >
                  ← Choose a different image
                </button>

                {/* Aspect Ratio Selection */}
                <div className={styles.aspectRatioSection}>
                  <h4>Shape</h4>
                  <div className={styles.aspectRatioButtons}>
                    <button
                      className={`${styles.aspectRatioBtn} ${
                        aspectRatio === "square" ? styles.active : ""
                      }`}
                      onClick={() => handleAspectRatioChange("square")}
                    >
                      Square
                    </button>
                    <button
                      className={`${styles.aspectRatioBtn} ${
                        aspectRatio === "circle" ? styles.active : ""
                      }`}
                      onClick={() => handleAspectRatioChange("circle")}
                    >
                      Circle
                    </button>
                    <button
                      className={`${styles.aspectRatioBtn} ${
                        aspectRatio === "rectangle" ? styles.active : ""
                      }`}
                      onClick={() => handleAspectRatioChange("rectangle")}
                    >
                      Rectangle
                    </button>
                  </div>
                </div>

                <div className={styles.cropModalBody}>
                  {/* Crop Container */}
                  <div className={styles.cropContainer}>
                    <div // eslint-disable-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                      className={styles.cropImageContainer}
                      onClick={handleCropMove}
                    >
                      <img
                        src={cropImage}
                        alt="Crop"
                        className={styles.cropImage}
                        onLoad={handleImageLoad}
                        style={{
                          width: imageDimensions.width || "auto",
                          height: imageDimensions.height || "auto",
                          transform: `rotate(${rotation}deg)`,
                          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                        }}
                      />
                      <div
                        className={`${styles.cropOverlay} ${
                          aspectRatio === "circle" ? styles.circle : ""
                        }`}
                        style={{
                          left: cropData.x,
                          top: cropData.y,
                          width: cropData.width,
                          height: cropData.height,
                        }}
                        onMouseDown={handleCropDrag}
                      >
                        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
                          className={styles.cropHandle + " " + styles.nw}
                          onMouseDown={(e) => handleCropResize(e, "nw")}
                        />
                        <div // eslint-disable-line jsx-a11y/no-static-element-interactions
                          className={styles.cropHandle + " " + styles.se}
                          onMouseDown={(e) => handleCropResize(e, "se")}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Customization Controls */}
                  <div className={styles.customizationControls}>
                    {/* Rotation */}
                    <div className={styles.controlGroup}>
                      <label>Rotation: {rotation}°</label>
                      <div className={styles.sliderContainer}>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={rotation}
                          onChange={(e) =>
                            setRotation(parseInt(e.target.value))
                          }
                          className={styles.slider}
                        />
                        <button
                          className={styles.resetBtn}
                          onClick={() => setRotation(0)}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Brightness */}
                    <div className={styles.controlGroup}>
                      <label>Brightness: {brightness}%</label>
                      <div className={styles.sliderContainer}>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={brightness}
                          onChange={(e) =>
                            setBrightness(parseInt(e.target.value))
                          }
                          className={styles.slider}
                        />
                        <button
                          className={styles.resetBtn}
                          onClick={() => setBrightness(100)}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Contrast */}
                    <div className={styles.controlGroup}>
                      <label>Contrast: {contrast}%</label>
                      <div className={styles.sliderContainer}>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={contrast}
                          onChange={(e) =>
                            setContrast(parseInt(e.target.value))
                          }
                          className={styles.slider}
                        />
                        <button
                          className={styles.resetBtn}
                          onClick={() => setContrast(100)}
                        >
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Zoom */}
                    <div className={styles.controlGroup}>
                      <label>Zoom: {zoom}%</label>
                      <div className={styles.sliderContainer}>
                        <input
                          type="range"
                          min="50"
                          max="200"
                          value={zoom}
                          onChange={(e) => setZoom(parseInt(e.target.value))}
                          className={styles.slider}
                        />
                        <button
                          className={styles.resetBtn}
                          onClick={() => setZoom(100)}
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview Section */}
                <div className={styles.previewSection}>
                  <h4>Preview</h4>
                  <div className={styles.previewContainer}>
                    <div className={styles.previewAvatar}>
                      <img
                        src={cropImage}
                        alt="Preview"
                        className={`${styles.previewImage} ${
                          aspectRatio === "circle" ? styles.circle : ""
                        }`}
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                        }}
                      />
                    </div>
                    <div className={styles.previewInfo}>
                      <p>Shape: {aspectRatio}</p>
                      <p>Rotation: {rotation}°</p>
                      <p>Brightness: {brightness}%</p>
                      <p>Contrast: {contrast}%</p>
                      <p>Filter: {activeFilter}</p>
                    </div>
                  </div>
                </div>

                {/* Filter Presets */}
                <div className={styles.filterSection}>
                  <h4>Filters</h4>
                  <div className={styles.filterButtons}>
                    <button
                      className={`${styles.filterBtn} ${
                        activeFilter === "none" ? styles.active : ""
                      }`}
                      onClick={() => setActiveFilter("none")}
                    >
                      None
                    </button>
                    <button
                      className={`${styles.filterBtn} ${
                        activeFilter === "grayscale" ? styles.active : ""
                      }`}
                      onClick={() => setActiveFilter("grayscale")}
                    >
                      Grayscale
                    </button>
                    <button
                      className={`${styles.filterBtn} ${
                        activeFilter === "sepia" ? styles.active : ""
                      }`}
                      onClick={() => setActiveFilter("sepia")}
                    >
                      Sepia
                    </button>
                    <button
                      className={`${styles.filterBtn} ${
                        activeFilter === "vintage" ? styles.active : ""
                      }`}
                      onClick={() => setActiveFilter("vintage")}
                    >
                      Vintage
                    </button>
                    <button
                      className={`${styles.filterBtn} ${
                        activeFilter === "cool" ? styles.active : ""
                      }`}
                      onClick={() => setActiveFilter("cool")}
                    >
                      Cool
                    </button>
                    <button
                      className={`${styles.filterBtn} ${
                        activeFilter === "warm" ? styles.active : ""
                      }`}
                      onClick={() => setActiveFilter("warm")}
                    >
                      Warm
                    </button>
                  </div>
                </div>

                <div className={styles.cropInstructions}>
                  <p>• Click and drag to move the crop area</p>
                  <p>• Drag the corners to resize</p>
                  <p>
                    • Use sliders to adjust brightness, contrast, rotation, and
                    zoom
                  </p>
                  <p>• Try different filters for unique looks</p>
                </div>

                {/* Reset All Button */}
                <div className={styles.resetAllSection}>
                  <button
                    className={styles.resetAllBtn}
                    onClick={() => {
                      setRotation(0);
                      setBrightness(100);
                      setContrast(100);
                      setZoom(100);
                      handleAspectRatioChange("square");
                      setActiveFilter("none");
                    }}
                  >
                    Reset All Settings
                  </button>
                </div>

                <div className={styles.cropButtons}>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCropCancel}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.confirmButton}
                    onClick={handleCropConfirm}
                    disabled={isUploading}
                  >
                    {isUploading ? "Processing..." : "Apply & Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
