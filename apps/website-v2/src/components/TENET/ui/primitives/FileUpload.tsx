/** [Ver001.000] */
/**
 * FileUpload Component
 * ====================
 * File input with drag-and-drop support and validation.
 */

import React from 'react';

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  dragAndDrop?: boolean;
  disabled?: boolean;
  className?: string;
  onUpload?: (files: File[]) => void;
  onError?: (error: string) => void;
}

export const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      accept,
      multiple = false,
      maxSize,
      maxFiles,
      dragAndDrop = true,
      disabled = false,
      onUpload,
      onError,
      className = '',
      ...props
    },
    ref
  ) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => inputRef.current!);

    const validateFiles = (files: FileList | null): File[] | null => {
      if (!files || files.length === 0) return null;

      const fileArray = Array.from(files);

      if (maxFiles && fileArray.length > maxFiles) {
        onError?.(`Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`);
        return null;
      }

      for (const file of fileArray) {
        if (maxSize && file.size > maxSize) {
          const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
          onError?.(`File size exceeds ${sizeMB}MB limit: ${file.name}`);
          return null;
        }
      }

      return fileArray;
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const validFiles = validateFiles(e.target.files);
      if (validFiles) {
        onUpload?.(validFiles);
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      if (dragAndDrop && !disabled) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (dragAndDrop && !disabled) {
        const validFiles = validateFiles(e.dataTransfer.files);
        if (validFiles) {
          onUpload?.(validFiles);
        }
      }
    };

    const handleClick = () => {
      inputRef.current?.click();
    };

    return (
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all duration-200 ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'} ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-gray-400 hover:bg-gray-100'} ${className}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={handleFileSelect}
          className="hidden"
          {...props}
        />
        <svg className="h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">
          <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
        </p>
        {accept && (
          <p className="mt-1 text-xs text-gray-500">
            {accept.replace(/\*/g, 'all').split(',').join(', ')}
          </p>
        )}
        {maxSize && (
          <p className="text-xs text-gray-500">
            Max size: {(maxSize / (1024 * 1024)).toFixed(1)}MB
          </p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export default FileUpload;
