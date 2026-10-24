import { useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  className?: string;
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/cloudinary/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Upload failed (${res.status})`);
  }

  const data = await res.json();
  return data.secure_url as string;
}

export function ImageUploadField({ value, onChange, label, className }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (JPG, PNG, WEBP)");
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
    } catch (err) {
      const msg = (err as Error)?.message || "Upload failed. Please try again.";
      setUploadError(msg);
      console.error("Upload failed:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group w-full h-40 rounded-lg overflow-hidden border border-gray-200">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-gray-100 transition-colors">
              <Upload size={12} /> Change
            </button>
            <button type="button" onClick={() => onChange("")}
              className="bg-white text-red-500 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-red-50 transition-colors">
              <X size={12} /> Remove
            </button>
          </div>
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
              <Loader2 size={24} className="text-white animate-spin" />
              <p className="text-white text-xs">Uploading…</p>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => !isUploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={cn(
            "w-full h-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50",
            isUploading && "pointer-events-none"
          )}
        >
          {isUploading ? (
            <>
              <Loader2 size={28} className="text-primary animate-spin" />
              <p className="text-xs text-gray-500">Uploading…</p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <ImageIcon size={20} className="text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-gray-700">Click to upload or drag & drop</p>
                <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP — max 20MB</p>
              </div>
            </>
          )}
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-1.5 text-red-500">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs">{uploadError}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
      />
    </div>
  );
}
