/** Reusable drag-drop upload zone. */
import { useState } from 'react';
import { Spin } from 'antd';
import { CheckCircleOutlined, UploadOutlined, CloseCircleOutlined } from '@ant-design/icons';

export default function UploadZone({ accept, label, hint, subHint, uploaded, uploading, error, onFile, onClear }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  const borderColor = error ? '#ef4444' : uploaded ? '#22c55e' : dragging ? '#6366f1' : '#2a2a3e';
  const bgColor     = error ? '#1a0808' : uploaded ? '#0a140d' : dragging ? '#13132a' : '#0f0f13';

  return (
    <label
      htmlFor={`upload-${label.replace(/\s/g, '-')}`}
      style={{
        display: 'block',
        border: `2px dashed ${borderColor}`,
        borderRadius: 10,
        background: bgColor,
        padding: '20px 16px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative',
        textAlign: 'center',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        id={`upload-${label.replace(/\s/g, '-')}`}
        type="file"
        accept={accept}
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {uploading ? (
        <div style={{ padding: '8px 0' }}>
          <Spin size="small" />
          <div style={{ color: '#9898b8', fontSize: 12, marginTop: 8 }}>Uploading…</div>
        </div>
      ) : uploaded ? (
        <div>
          <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 22, marginBottom: 6 }} />
          <div style={{ color: '#22c55e', fontSize: 13, fontWeight: 700 }}>{uploaded.name}</div>
          <div style={{ color: '#6b6b8a', fontSize: 11, marginTop: 2 }}>{uploaded.count} records loaded</div>
          {onClear && (
            <div
              style={{ color: '#ef444499', fontSize: 11, marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
              onClick={e => { e.preventDefault(); onClear(); }}
            >
              <CloseCircleOutlined /> Clear
            </div>
          )}
        </div>
      ) : error ? (
        <div>
          <CloseCircleOutlined style={{ color: '#ef4444', fontSize: 22, marginBottom: 6 }} />
          <div style={{ color: '#ef4444', fontSize: 13, fontWeight: 600 }}>Upload failed</div>
          <div style={{ color: '#9898b8', fontSize: 11, marginTop: 2 }}>{error}</div>
        </div>
      ) : (
        <div>
          <UploadOutlined style={{ color: '#6b6b8a', fontSize: 24, marginBottom: 8 }} />
          <div style={{ color: dragging ? '#818cf8' : '#9898b8', fontSize: 13, fontWeight: 500 }}>
            {dragging ? 'Drop it here!' : `Drop ${label} or click to browse`}
          </div>
          <div style={{ color: '#4a4a6a', fontSize: 11, marginTop: 4 }}>{hint}</div>
          {subHint && <div style={{ color: '#3a3a5a', fontSize: 10, marginTop: 2 }}>{subHint}</div>}
        </div>
      )}
    </label>
  );
}
