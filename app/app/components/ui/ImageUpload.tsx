import { useState, useRef } from 'react';
import api from '../../../shared/lib/api';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  currentUrl?: string;
  label?: string;
  type?: string;
}

export function ImageUpload({ onUpload, currentUrl, label, type = 'general' }: ImageUploadProps) {
  const [preview, setPreview] = useState(currentUrl || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const localUrl = URL.createObjectURL(file);
      setPreview(localUrl);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      URL.revokeObjectURL(localUrl);
      setPreview(res.data.url);
      onUpload(res.data.url);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Upload failed');
      setPreview(currentUrl || '');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview('');
    onUpload('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 flex-shrink-0">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="btn btn-secondary text-sm px-3 py-1.5"
          >
            {uploading ? 'Uploading...' : 'Choose Image'}
          </button>
          {preview && (
            <button type="button" onClick={handleRemove} className="text-xs text-red-600 hover:underline">
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFile} className="hidden" />
    </div>
  );
}
