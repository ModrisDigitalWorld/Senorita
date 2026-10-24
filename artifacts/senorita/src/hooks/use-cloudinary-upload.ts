import { useState } from "react";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

export function useCloudinaryUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File): Promise<CloudinaryUploadResult> => {
    setIsUploading(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/cloudinary/upload", {
        method: "POST",
        body: formData,
      });

      setProgress(90);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();
      setProgress(100);
      return { secure_url: data.secure_url, public_id: data.public_id ?? "" };
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return { uploadFile, isUploading, progress };
}
