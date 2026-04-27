import { useState, useEffect, useRef } from 'react'
import { commentService } from '../api/commentService'
import { useAuth } from '../hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { Send, Pencil, Trash2, X, Check } from 'lucide-react'
import ConfirmModal from './ConfirmModal'

/**
 * CommentSection — full comment thread with add/edit/delete.
 */
export default function CommentSection({ ticketId }) {
  const { user, isAdmin } = useAuth()
  const [comments, setComments]     = useState([])
  const [loading,  setLoading]      = useState(true)
  const [content,  setContent]      = useState('')
  const [posting,  setPosting]      = useState(false)
  const [editId,   setEditId]       = useState(null)
  const [editText, setEditText]     = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState(null)
  const bottomRef = useRef(null)

  const load = async () => {
    try {
      const { data } = await commentService.getAll(ticketId)
      setComments(data)
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [ticketId])

  const submit = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    setPosting(true)
    try {
      const { data } = await commentService.add(ticketId, { content })
      setComments(prev => [...prev, data])
      setContent('')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  const saveEdit = async (id) => {
    if (!editText.trim()) return
    try {
      const { data } = await commentService.update(ticketId, id, { content: editText })
      setComments(prev => prev.map(c => c.id === id ? data : c))
      setEditId(null)
    } catch {
      toast.error('Failed to update comment')
    }
  }

  const remove = (id) => {
    setCommentToDelete(id)
    setShowConfirmModal(true)
  }

  const executeRemove = async () => {
    try {
      await commentService.delete(ticketId, commentToDelete)
      setComments(prev => prev.filter(c => c.id !== commentToDelete))
      toast.success('Comment deleted')
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const initials = (name = '') =>
    name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="comment-section">
      <h3 className="heading-3" style={{ marginBottom: 'var(--space-5)' }}>
        💬 Comments ({comments.length})
      </h3>

      {loading ? (
        <div className="flex-center" style={{ padding: 'var(--space-8)' }}>
          <div className="spinner" />
        </div>
      ) : (
        <div className="comment-list">
          {comments.length === 0 && (
            <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
              <p>No comments yet. Be the first to add one!</p>
            </div>
          )}

          {comments.map(c => (
            <div key={c.id} className={`comment-item ${c.author?.id === user?.userId ? 'comment-item--own' : ''}`}>
              <div className="avatar avatar-lg">{initials(c.author?.name)}</div>

              <div className="comment-body">
                <div className="comment-header">
                  <span className="comment-author">{c.author?.name}</span>
                  <span className="badge badge-{c.author?.role?.toLowerCase()}" style={{ fontSize: '0.7rem' }}>
                    {c.author?.role}
                  </span>
                  <span className="comment-time">
                    {c.updatedAt !== c.createdAt ? 'edited · ' : ''}
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {editId === c.id ? (
                  <div className="comment-edit">
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                    />
                    <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditId(null)}>
                        <X size={13} /> Cancel
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={() => saveEdit(c.id)}>
                        <Check size={13} /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="comment-content">{c.content}</p>
                )}
              </div>

              {/* Actions: only for own comment or admin */}
              {(c.editable || isAdmin) && editId !== c.id && (
                <div className="comment-actions">
                  {c.editable && (
                    <button
                      className="btn btn-ghost btn-icon"
                      onClick={() => { setEditId(c.id); setEditText(c.content) }}
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-icon"
                    onClick={() => remove(c.id)}
                    title="Delete"
                    style={{ color: 'var(--clr-error)' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* New comment input */}
      <form onSubmit={submit} className="comment-form">
        <div className="avatar">{initials(user?.name)}</div>
        <div className="comment-input-wrapper">
          <textarea
            className="form-textarea"
            rows={2}
            placeholder="Write a comment…"
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e) }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={posting || !content.trim()}
          >
            {posting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Send size={15} />}
            Post
          </button>
        </div>
      </form>

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={executeRemove}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />

      <style>{`
        .comment-section { margin-top: var(--space-8); }
        .comment-list { display: flex; flex-direction: column; gap: var(--space-4); margin-bottom: var(--space-6); }

        .comment-item {
          display: flex; gap: var(--space-3);
          padding: var(--space-4);
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
          position: relative;
          transition: var(--transition);
        }
        .comment-item:hover { border-color: var(--clr-border-hover); }
        .comment-item--own { border-left: 2px solid var(--clr-primary); }

        .comment-body { flex: 1; min-width: 0; }
        .comment-header {
          display: flex; align-items: center; gap: var(--space-2);
          flex-wrap: wrap;
          margin-bottom: var(--space-2);
        }
        .comment-author { font-size: 0.875rem; font-weight: 600; }
        .comment-time { font-size: 0.75rem; color: var(--clr-text-3); margin-left: auto; }
        .comment-content { font-size: 0.9rem; color: var(--clr-text-2); line-height: 1.6; white-space: pre-wrap; }
        .comment-edit { display: flex; flex-direction: column; gap: var(--space-2); }

        .comment-actions {
          display: flex; gap: var(--space-1); align-self: flex-start;
          opacity: 0; transition: var(--transition);
        }
        .comment-item:hover .comment-actions { opacity: 1; }

        .comment-form {
          display: flex; gap: var(--space-3); align-items: flex-start;
          padding: var(--space-4);
          background: var(--clr-surface-2);
          border: 1px solid var(--clr-border);
          border-radius: var(--radius-md);
        }
        .comment-input-wrapper {
          flex: 1;
          display: flex; flex-direction: column; gap: var(--space-2);
        }
        .comment-input-wrapper .btn { align-self: flex-end; }
      `}</style>
    </div>
  )
}
