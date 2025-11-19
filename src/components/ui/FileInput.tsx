import React, { useRef } from 'react';
import { FiSearch } from 'react-icons/fi';

interface FileInputProps {
  label: string;
  accept?: string;
  required?: boolean;
  value: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  accept = ".pdf",
  required = false,
  value,
  onChange,
  className = ""
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`file-input-wrapper ${className}`}>
      <label className="block mb-2">{label}</label>
      <div className="file-input-container">
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          required={required}
          style={{ display: 'none' }}
        />
        <div className="file-input-display" onClick={handleClick}>
          <div className="file-input-button">
            <FiSearch size={16} />
            <span>Choose File</span>
          </div>
          <div className="file-input-status">
            {value ? value.name : 'no file selected'}
          </div>
        </div>
      </div>
      <style jsx>{`
        .file-input-container {
          position: relative;
          cursor: pointer;
        }
        
        .file-input-display {
          display: flex;
          align-items: center;
          background: var(--field, #012b2b);
          border: 1px solid var(--border, #333);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        
        .file-input-display:hover {
          border-color: #ea580c;
          box-shadow: 0 0 15px rgba(234, 88, 12, 0.4);
        }
        
        .file-input-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #ea580c;
          border-right: 1px solid var(--border, #333);
          color: #fff;
          font-size: 14px;
          transition: all 0.3s ease;
          font-weight: 500;
        }
        
        .file-input-button:hover {
          background: #d97706;
          box-shadow: 0 0 10px rgba(234, 88, 12, 0.5);
          transform: translateY(-1px);
        }
        
        .file-input-status {
          flex: 1;
          padding: 12px 16px;
          color: var(--text-secondary, #94a3b8);
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          background: var(--panel, #053639);
        }
        
        .file-input-status:has-file {
          color: #fff;
        }
      `}</style>
    </div>
  );
};

export default FileInput;
