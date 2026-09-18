'use client';

import React, { useRef, useState } from 'react';
import { FileInputData } from '../utils/calculationEngine';

interface FileUploaderProps {
  onFilesLoaded: (files: FileInputData[]) => void;
  files: FileInputData[];
  onClear: () => void;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesLoaded, files, onClear }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFileList = async (fileList: FileList) => {
    setIsLoading(true);
    const loadedFiles: FileInputData[] = [];

    const fileArray = Array.from(fileList).filter(
      (f) => f.name.toLowerCase().endsWith('.geojson') || f.name.toLowerCase().endsWith('.json')
    );

    for (const file of fileArray) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        loadedFiles.push({
          name: file.name,
          content: text,
          geojson: json,
        });
      } catch (err: any) {
        loadedFiles.push({
          name: file.name,
          content: '',
          error: `JSON Parse Error: ${err.message}`,
        });
      }
    }

    onFilesLoaded(loadedFiles);
    setIsLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-6 font-sans">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Dataset Upload
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select `.geojson` or `.json` files, or upload an entire directory folder.
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={onClear}
            className="text-slate-500 hover:text-red-600 text-xs font-medium transition-colors cursor-pointer"
          >
            Clear ({files.length})
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-slate-800 bg-slate-50'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/30'
        }`}
      >
        <p className="text-xs font-semibold text-slate-800">
          Drag and drop `.geojson` or `.json` files here
        </p>
        <p className="text-[11px] text-slate-400 mt-1 mb-5">
          Automatic 6-decimal rounding and EUDR spec verification
        </p>

        <div className="flex items-center justify-center gap-2">
          {/* File input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".geojson,.json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-all cursor-pointer"
          >
            Select Files
          </button>

          {/* Folder input */}
          <input
            ref={folderInputRef}
            type="file"
            // @ts-expect-error webkitdirectory is supported in browsers
            webkitdirectory="true"
            directory="true"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-all cursor-pointer"
          >
            Upload Folder
          </button>
        </div>
      </div>

      {/* File List Summary */}
      {files.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
            <span>Loaded Files ({files.length})</span>
            <span className="text-slate-600 font-medium">Ready</span>
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200/60 text-xs"
              >
                <span className="font-mono text-slate-800 text-[11px] truncate">{file.name}</span>
                {file.error ? (
                  <span className="text-red-600 text-[10px] bg-red-50 px-1.5 py-0.5 rounded font-medium">
                    Error
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono text-[11px]">
                    {file.geojson?.features?.length ?? 0} features
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
