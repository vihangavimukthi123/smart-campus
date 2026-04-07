import { useCallback, useState } from 'react'
import { Upload, X, ImageIcon, AlertCircle } from 'lucide-react'

const MAX_FILES   = 3
const MAX_SIZE_MB = 10
const ALLOWED     = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * ImageUploader — drag-and-drop image picker with previews, max 3 files.
 * @param {File[]} files        - controlled list of files
 * @param {Function} onChange   - called with new File[] on change
 */
export default function ImageUploader({ files = [], onChange }) {
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState('')

  const validate = (newFiles) => {
    for (const f of newFiles) {
      if (!ALLOWED.includes(f.type)) {
        return `File "${f.name}" is not an allowed image type. Use JPG, PNG, GIF or WebP.`
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        return `File "${f.name}" exceeds the ${MAX_SIZE_MB}MB limit.`
      }
    }
    return ''
  }

  const addFiles = useCallback((incoming) => {
    const combined = [...files, ...incoming]
    if (combined.length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} images per ticket.`)
      return
    }
    const err = validate(incoming)
    if (err) { setError(err); return }
    setError('')
    onChange(combined)
  }, [files, onChange])

  const remove = (index) => {
    const updated = files.filter((_, i) => i !== index)
    onChange(updated)
    setError('')
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    addFiles(dropped)
  }

  const onInputChange = (e) => {
    addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  return (
    <div className="image-uploader">
      {/* Drop zone */}
      {files.length < MAX_FILES && (
        <div
          className={`drop-zone ${dragging ? 'drop-zone--active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('img-upload-input').click()}
        >
          <Upload size={28} className="drop-zone__icon" />
          <p className="drop-zone__title">Drop images here or <span>browse</span></p>
          <p className="drop-zone__hint">
            JPG, PNG, GIF, WebP · Max {MAX_SIZE_MB}MB each · {files.length}/{MAX_FILES} uploaded
          </p>
          <input
            id="img-upload-input"
            type="file"
            accept={ALLOWED.join(',')}
            multiple
            hidden
            onChange={onInputChange}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="uploader-error">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Previews */}
      {files.length > 0 && (
        <div className="preview-grid">
          {files.map((file, idx) => (
            <div key={idx} className="preview-item">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="preview-img"
              />
              <div className="preview-info">
                <span className="preview-name">{file.name}</span>
                <span className="preview-size">{(file.size / 1024).toFixed(0)} KB</span>
              </div>
              <button
                type="button"
                className="preview-remove"
                onClick={() => remove(idx)}
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .image-uploader { display: flex; flex-direction: column; gap: var(--space-3); }

        .drop-zone {
          border: 2px dashed var(--clr-border);
          border-radius: var(--radius-lg);
          padding: var(--space-8) var(--space-6);
          text-align: center;
          cursor: pointer;
          transition: var(--transition);
          background: var(--clr-surface-2);
        }
        .drop-zone:hover, .drop-zone--active {
          border-color: var(--clr-primary);
          background: rgba(99,102,241,0.05);
        }
        .drop-zone__icon { color: var(--clr-text-3); margin: 0 auto var(--space-3); }
        .drop-zone__title { font-size: 0.9375rem; color: var(--clr-text-2); margin-bottom: var(--space-1); }
        .drop-zone__title span { color: var(--clr-primary); font-weight: 500; }
        .drop-zone__hint { font-size: 0.8125rem; color: var(--clr-text-3); }

        .uploader-error {
          display: flex; align-items: center; gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: var(--radius-md);
          font-size: 0.875rem; color: var(--clr-error);
        }

        .preview-grid { display: flex; flex-direction: column; gap: var(--space-3); }
        .preview-item {
          display: flex; align-items: center; gap: var(--space-3);
          padding: var(--space-3);
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
        }
        .preview-img {
          width: 56px; height: 56px;
          object-fit: cover;
          border-radius: var(--radius-sm);
          flex-shrink: 0;
        }
        .preview-info { flex: 1; min-width: 0; }
        .preview-name {
          display: block; font-size: 0.875rem; font-weight: 500;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .preview-size { font-size: 0.75rem; color: var(--clr-text-3); }
        .preview-remove {
          flex-shrink: 0;
          padding: var(--space-2); border: none;
          background: rgba(239,68,68,0.1);
          color: var(--clr-error);
          border-radius: var(--radius-sm);
          transition: var(--transition);
        }
        .preview-remove:hover { background: rgba(239,68,68,0.25); }
      `}</style>
    </div>
  )
}
