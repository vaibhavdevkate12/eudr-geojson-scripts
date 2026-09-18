'use client';

import React, { useRef, useState } from 'react';
import { Upload, FolderPlus, FileCode, Trash2, CheckCircle2, FileJson, AlertCircle } from 'lucide-react';
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
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileJson className="w-5 h-5 text-emerald-600" />
            Upload GeoJSON & JSON Files
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Select multiple `.geojson` or `.json` files, or upload an entire directory folder.
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs font-medium rounded-lg border border-slate-200 hover:border-red-200 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear Files ({files.length})
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
            : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
        }`}
      >
        <div className="flex justify-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/60 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <Upload className="w-6 h-6" />
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100/60 border border-blue-200 flex items-center justify-center text-blue-600">
            <FolderPlus className="w-6 h-6" />
          </div>
        </div>

        <p className="text-sm font-semibold text-slate-800">
          Drag & drop `.geojson` or `.json` files here
        </p>
        <p className="text-xs text-slate-500 mt-1 mb-6">
          Supports individual file selection or full folder scanning
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <FileCode className="w-4 h-4" />
            Select Files
          </button>

          {/* Folder input */}
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            Upload Folder
          </button>
        </div>
      </div>

      {/* File List Summary */}
      {files.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
            <span>Loaded Files ({files.length})</span>
            <span className="text-emerald-700 font-semibold">Ready for Processing</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {file.error ? (
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-mono text-slate-800 font-medium truncate">{file.name}</span>
                </div>
                {file.error ? (
                  <span className="text-red-600 text-[11px] bg-red-100 px-2 py-0.5 rounded font-medium">
                    Parse Error
                  </span>
                ) : (
                  <span className="text-slate-500 text-[11px]">
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
