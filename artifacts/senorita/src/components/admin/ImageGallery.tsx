import { useRef, useState, useCallback } from "react";
import { Plus, X, Loader2, ImageIcon, Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

interface ModalState {
  file: File | null;
  previewUrl: string | null;
  title: string;
  alt: string;
  error: string | null;
  uploading: boolean;
}

const emptyModal: ModalState = {
  file: null, previewUrl: null, title: "", alt: "", error: null, uploading: false,
};

async function compressImage(file: File): Promise<File> {
  const MAX_PX = 1600;
  const QUALITY = 0.85;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > MAX_PX || height > MAX_PX) {
        if (width >= height) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
        else { width = Math.round(width * MAX_PX / height); height = MAX_PX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file),
        "image/jpeg", QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function extractCloudinaryPublicId(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]{2,4})?$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function deleteFromCloudinary(url: string): Promise<void> {
  const public_id = extractCloudinaryPublicId(url);
  if (!public_id || !url.includes("cloudinary.com")) return;
  try {
    await fetch("/api/cloudinary/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_id }),
    });
  } catch {
    // fire-and-forget — don't block the UI
  }
}

async function uploadToCloudinary(file: File, title: string, alt: string): Promise<string> {
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressed);
  if (title) formData.append("title", title);
  if (alt) formData.append("alt", alt);

  const res = await fetch("/api/cloudinary/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Upload failed (${res.status})`);
  }
  const data = await res.json();
  return data.secure_url as string;
}

export function ImageGallery({ images, onChange, maxImages = 10, label }: ImageGalleryProps) {
  const inputId = useRef(`img-gallery-${Math.random().toString(36).slice(2)}`).current;
  const modalInputId = useRef(`img-modal-${Math.random().toString(36).slice(2)}`).current;
  const [showModal, setShowModal] = useState(false);
  const [modal, setModal] = useState<ModalState>(emptyModal);
  const [galleryError, setGalleryError] = useState<string | null>(null);
  const [draggingGallery, setDraggingGallery] = useState(false);
  const [draggingModal, setDraggingModal] = useState(false);

  const imagesRef = useRef(images);
  imagesRef.current = images;

  const openModal = () => {
    setModal(emptyModal);
    setShowModal(true);
  };

  const closeModal = () => {
    if (modal.previewUrl) URL.revokeObjectURL(modal.previewUrl);
    setModal(emptyModal);
    setShowModal(false);
  };

  const pickFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setModal(m => ({ ...m, error: "Please select an image file (JPG, PNG, WEBP)" }));
      return;
    }
    if (modal.previewUrl) URL.revokeObjectURL(modal.previewUrl);
    const previewUrl = URL.createObjectURL(file);
    setModal(m => ({ ...m, file, previewUrl, error: null }));
  }, [modal.previewUrl]);

  const handleModalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingModal(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  };

  const handleGalleryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggingGallery(false);
    const file = e.dataTransfer.files?.[0];
    if (file) { openModal(); pickFile(file); }
  };

  const handleUpload = async () => {
    if (!modal.file) {
      setModal(m => ({ ...m, error: "Please select an image first." }));
      return;
    }
    setModal(m => ({ ...m, uploading: true, error: null }));
    try {
      const url = await uploadToCloudinary(modal.file, modal.title, modal.alt);
      onChange([...imagesRef.current, url]);
      setGalleryError(null);
      closeModal();
    } catch (err) {
      const msg = (err as Error)?.message || "Upload failed. Please try again.";
      setModal(m => ({ ...m, uploading: false, error: msg }));
    }
  };

  const removeImage = (idx: number) => {
    const url = images[idx];
    onChange(images.filter((_, i) => i !== idx));
    deleteFromCloudinary(url);
  };
  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const arr = [...images];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    onChange(arr);
  };

  const canAdd = images.length < maxImages;

  return (
    <>
      <div className="space-y-2">
        {label && (
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
            {label}
          </label>
        )}

        <div className="grid grid-cols-3 gap-2">
          {images.map((src, i) => (
            <div key={src + i} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
              <img src={src} alt={`Product image ${i + 1}`} className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                  MAIN
                </span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => moveImage(i, i - 1)}
                    className="bg-white/90 text-gray-700 rounded p-1 hover:bg-white text-[10px] font-bold" title="Move left">◀</button>
                )}
                <button type="button" onClick={() => removeImage(i)}
                  className="bg-white/90 text-red-500 rounded p-1 hover:bg-white">
                  <X size={12} />
                </button>
                {i < images.length - 1 && (
                  <button type="button" onClick={() => moveImage(i, i + 1)}
                    className="bg-white/90 text-gray-700 rounded p-1 hover:bg-white text-[10px] font-bold" title="Move right">▶</button>
                )}
              </div>
            </div>
          ))}

          {canAdd && (
            <div
              onClick={openModal}
              onDragOver={(e) => { e.preventDefault(); setDraggingGallery(true); }}
              onDragLeave={() => setDraggingGallery(false)}
              onDrop={handleGalleryDrop}
              className={cn(
                "aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors select-none",
                draggingGallery ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center pointer-events-none">
                <Plus size={16} className="text-gray-400" />
              </div>
              <p className="text-[9px] text-gray-400 text-center px-1 pointer-events-none">
                {images.length === 0 ? "Add image" : "Add more"}
              </p>
            </div>
          )}
        </div>

        {galleryError && (
          <div className="flex items-start gap-1.5 text-red-500">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <p className="text-xs">{galleryError}</p>
          </div>
        )}

        {images.length === 0 && (
          <p className="text-[10px] text-gray-400">First image will be the main product photo</p>
        )}
      </div>

      {/* Add Image Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Add Product Image</h3>
              <button type="button" onClick={(e) => { e.stopPropagation(); closeModal(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Image picker / preview */}
              {modal.previewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200 h-48">
                  <img src={modal.previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <label
                    htmlFor={modalInputId}
                    className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                  >
                    <span className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5">
                      <Upload size={12} /> Change photo
                    </span>
                  </label>
                </div>
              ) : (
                <label
                  htmlFor={modalInputId}
                  onDragOver={(e) => { e.preventDefault(); setDraggingModal(true); }}
                  onDragLeave={() => setDraggingModal(false)}
                  onDrop={handleModalDrop}
                  className={cn(
                    "flex flex-col items-center justify-center gap-3 h-48 rounded-lg border-2 border-dashed cursor-pointer transition-colors",
                    draggingModal ? "border-primary bg-primary/5" : "border-gray-200 hover:border-primary/50 hover:bg-gray-50"
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center pointer-events-none">
                    <ImageIcon size={22} className="text-gray-400" />
                  </div>
                  <div className="text-center pointer-events-none">
                    <p className="text-sm font-semibold text-gray-700">Click to select photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">or drag and drop here</p>
                    <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP — max 20MB</p>
                  </div>
                </label>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Image Title <span className="normal-case text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={modal.title}
                  onChange={e => setModal(m => ({ ...m, title: e.target.value }))}
                  placeholder="e.g. Front view, Side angle…"
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary rounded"
                />
              </div>

              {/* Alt Text */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Alt Text <span className="normal-case text-gray-400 font-normal">(optional — helps with SEO)</span>
                </label>
                <input
                  type="text"
                  value={modal.alt}
                  onChange={e => setModal(m => ({ ...m, alt: e.target.value }))}
                  placeholder="e.g. Floral crop top in red, front view"
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary rounded"
                />
              </div>

              {modal.error && (
                <div className="flex items-start gap-1.5 text-red-500">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <p className="text-xs">{modal.error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); closeModal(); }}
                disabled={modal.uploading}
                className="flex-1 border border-gray-200 text-gray-600 text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!modal.file || modal.uploading}
                className="flex-1 bg-primary text-white text-sm font-medium py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {modal.uploading ? (
                  <><Loader2 size={14} className="animate-spin" /> Uploading…</>
                ) : (
                  <><Upload size={14} /> Add to Gallery</>
                )}
              </button>
            </div>
            {/* Hidden file input for modal */}
            <input
              id={modalInputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
                e.target.value = "";
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
