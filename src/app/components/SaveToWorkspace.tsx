'use client'
import { useState, useEffect } from 'react'
import { getUserWorkspaces, saveToWorkspace, createWorkspace } from '../lib/workspace'

interface Props {
  userId: string
  assetKey: string
  assetValue: any
  onSaved?: (address: string) => void
}

export default function SaveToWorkspace({ userId, assetKey, assetValue, onSaved }: Props) {
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedAddress, setSavedAddress] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newAddress, setNewAddress] = useState('')
  const [creatingNew, setCreatingNew] = useState(false)

  useEffect(() => {
    getUserWorkspaces(userId).then(data => {
      setWorkspaces(data)
      if (data.length > 0) setSelectedId(data[0].id)
    })
  }, [userId])

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    await saveToWorkspace(selectedId, assetKey, assetValue)
    const ws = workspaces.find(w => w.id === selectedId)
    setSavedAddress(ws?.address || 'workspace')
    setSaved(true)
    setSaving(false)
    onSaved?.(ws?.address || '')
  }

  const handleCreateNew = async () => {
    if (!newAddress.trim()) return
    setCreatingNew(true)
    const created = await createWorkspace(userId, newAddress.trim())
    if (created) {
      await saveToWorkspace(created.id, assetKey, assetValue)
      setSavedAddress(created.address)
      setSaved(true)
      setShowNewModal(false)
    }
    setCreatingNew(false)
    onSaved?.(newAddress.trim())
  }

  if (dismissed) return null
  if (saved) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)',
        borderRadius: '10px', padding: '10px 16px', marginTop: '12px',
      }}>
        <span style={{ color: '#1D9E75', fontSize: '16px' }}>✅</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1D9E75', flex: 1 }}>
          Saved to <strong>{savedAddress}</strong> workspace
        </span>
        <a href={`/workspaces`} style={{ fontSize: '12px', color: '#1D9E75', textDecoration: 'none', fontWeight: '600' }}>
          View →
        </a>
      </div>
    )
  }

  return (
    <>
      <div style={{
        background: 'var(--lw-card)', border: '1px solid var(--lw-border)',
        borderRadius: '12px', padding: '12px 16px', marginTop: '12px',
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '16px' }}>💾</span>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text)', flexShrink: 0 }}>
          Save to a listing workspace?
        </span>

        {workspaces.length > 0 ? (
          <select
            value={selectedId}
            onChange={e => {
              if (e.target.value === '__new__') { setShowNewModal(true) }
              else setSelectedId(e.target.value)
            }}
            style={{
              flex: 1, minWidth: '140px', padding: '7px 10px',
              background: 'var(--lw-input)', border: '1px solid var(--lw-border)',
              borderRadius: '7px', fontSize: '12px', color: 'var(--lw-text)',
            }}
          >
            {workspaces.map(ws => (
              <option key={ws.id} value={ws.id}>{ws.address}</option>
            ))}
            <option value="__new__">+ Create new workspace</option>
          </select>
        ) : (
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              flex: 1, padding: '7px 14px', background: 'var(--lw-input)',
              border: '1px solid var(--lw-border)', borderRadius: '7px',
              fontSize: '12px', color: 'var(--lw-text-muted)', cursor: 'pointer', textAlign: 'left' as const,
              fontFamily: 'var(--font-plus-jakarta), sans-serif',
            }}
          >
            + Create new workspace
          </button>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !selectedId}
          style={{
            padding: '7px 16px', background: saving ? '#a0c4ba' : 'linear-gradient(135deg,#1D9E75,#085041)',
            color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px',
            fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', flexShrink: 0,
            fontFamily: 'var(--font-plus-jakarta), sans-serif',
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'none', border: 'none', color: 'var(--lw-text-muted)',
            fontSize: '16px', cursor: 'pointer', padding: '0 4px', flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {showNewModal && (
        <div
          onClick={() => setShowNewModal(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--lw-card)', borderRadius: '14px', border: '1px solid var(--lw-border)', padding: '1.5rem', width: '100%', maxWidth: '380px' }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 12px' }}>New Listing Workspace</h3>
            <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '5px', textTransform: 'uppercase' as const, letterSpacing: '0.3px' }}>
              Property Address
            </label>
            <input
              placeholder="123 Main St, Newport Beach, CA"
              value={newAddress}
              onChange={e => setNewAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateNew()}
              style={{
                width: '100%', padding: '10px 13px', background: 'var(--lw-input)',
                border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px',
                color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none',
                fontFamily: 'var(--font-plus-jakarta), sans-serif', marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCreateNew}
                disabled={creatingNew || !newAddress.trim()}
                style={{
                  flex: 1, padding: '10px', background: creatingNew ? '#a0c4ba' : 'linear-gradient(135deg,#1D9E75,#085041)',
                  color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px',
                  fontWeight: '700', cursor: creatingNew ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                {creatingNew ? 'Creating…' : 'Create & Save'}
              </button>
              <button
                onClick={() => setShowNewModal(false)}
                style={{
                  padding: '10px 16px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)',
                  border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px',
                  cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
