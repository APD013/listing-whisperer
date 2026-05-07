'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function RemindersPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('starter')
  const [planLoaded, setPlanLoaded] = useState(false)
  const [reminders, setReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ content: '', remind_at: '' })
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('upcoming')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles').select('plan').eq('id', user.id).single()
      if (profile) { setPlan(profile.plan || 'starter'); setPlanLoaded(true) }
      else { setPlanLoaded(true) }
      await loadReminders(user.id)
    }
    getUser()
  }, [])

  const loadReminders = async (uid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', uid)
      .order('remind_at', { ascending: true })
    if (data) setReminders(data)
    setLoading(false)
  }

  const addReminder = async () => {
    if (!form.content || !form.remind_at) { alert('Please fill in both fields'); return }
    setSaving(true)
    const { error } = await supabase.from('reminders').insert({
      user_id: userId,
      content: form.content,
      remind_at: new Date(form.remind_at).toISOString(),
      sent: false,
    })
    if (!error) {
      setForm({ content: '', remind_at: '' })
      setShowForm(false)
      await loadReminders(userId!)
    }
    setSaving(false)
  }

  const markDone = async (id: string) => {
    await supabase.from('reminders').update({ sent: true }).eq('id', id)
    setReminders(prev => prev.map(r => r.id === id ? { ...r, sent: true } : r))
  }

  const deleteReminder = async (id: string) => {
    await supabase.from('reminders').delete().eq('id', id)
    setReminders(prev => prev.filter(r => r.id !== id))
  }

  const now = new Date()
  const upcoming = reminders.filter(r => !r.sent && new Date(r.remind_at) >= now)
  const overdue = reminders.filter(r => !r.sent && new Date(r.remind_at) < now)
  const completed = reminders.filter(r => r.sent)
  const filtered = activeTab === 'upcoming' ? upcoming : activeTab === 'overdue' ? overdue : completed

  const cardStyle = {
    background: 'var(--lw-card)', borderRadius: '16px',
    border: '1px solid var(--lw-border)', padding: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem'
  }

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: 'var(--lw-input)',
    border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '14px',
    fontWeight: '500' as const, color: 'var(--lw-text)', boxSizing: 'border-box' as const,
    outline: 'none', fontFamily: 'var(--font-plus-jakarta), sans-serif'
  }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>

      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '20%', left: '5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(217,119,6,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--lw-text)' }}>
          Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{ marginLeft: '6px', background: 'linear-gradient(135deg,#1D9E75,#085041)', color: '#fff', fontSize: '9px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.5px', verticalAlign: 'middle', boxShadow: '0 0 10px rgba(29,158,117,0.4)' }}>PRO</span>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(245,158,11,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>REMINDERS</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Never miss a follow-up.</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>Set reminders from the AI chat or add them manually — with one-click Google Calendar links.</p>
          <button onClick={() => { setShowForm(true); document.getElementById('reminders-content')?.scrollIntoView({ behavior: 'smooth' }) }}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            + Add Reminder →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {[
              { s: '1', icon: '💬', title: 'Ask the AI to remind you', desc: 'Say "remind me to call John on Friday" in any chat window.' },
              { s: '2', icon: '✏️', title: 'Or add one manually', desc: 'Pick a date, time, and what needs to get done.' },
              { s: '3', icon: '📅', title: 'Add to Google Calendar', desc: 'One click to sync any reminder to your calendar.' },
            ].map(({ s, icon, title, desc }) => (
              <div key={s} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '14px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ width: '22px', height: '22px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', color: '#fff', flexShrink: 0 }}>{s}</span>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)', lineHeight: '1.4' }}>{title}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
            {[
              { icon: '⏰', label: 'Upcoming Reminders', desc: 'See everything that's coming up so you can stay ahead.' },
              { icon: '🔴', label: 'Overdue Alerts', desc: 'Overdue items are flagged in red so nothing falls through the cracks.' },
              { icon: '✅', label: 'Mark as Done', desc: 'One click to mark a reminder complete and move it to history.' },
              { icon: '📅', label: 'Google Calendar Sync', desc: 'Add any reminder directly to Google Calendar in one click.' },
              { icon: '💬', label: 'AI-Generated Reminders', desc: 'Ask the AI to set a reminder from any chat window.' },
            ].map(({ icon, label, desc }) => (
              <div key={label} style={{ background: 'var(--lw-card)', border: '1px solid var(--lw-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <span style={{ fontSize: '1.2rem' }}>{icon}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--lw-text)' }}>{label}</span>
                <span style={{ fontSize: '12px', color: 'var(--lw-text-muted)', lineHeight: '1.5' }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STATS + ADD BUTTON */}
        <div id="reminders-content" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ef4444', margin: '0', letterSpacing: '-0.03em' }}>{overdue.length}</p>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', margin: '2px 0 0', letterSpacing: '0.5px' }}>OVERDUE</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1D9E75', margin: '0', letterSpacing: '-0.03em' }}>{upcoming.length}</p>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', margin: '2px 0 0', letterSpacing: '0.5px' }}>UPCOMING</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--lw-text-muted)', margin: '0', letterSpacing: '-0.03em' }}>{completed.length}</p>
              <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', margin: '2px 0 0', letterSpacing: '0.5px' }}>DONE</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '11px 22px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 16px rgba(245,158,11,0.3)', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
            + Add Reminder
          </button>
        </div>

        {/* ADD FORM */}
        {showForm && (
          <div style={{ ...cardStyle, border: '1px solid rgba(245,158,11,0.25)', boxShadow: '0 4px 20px rgba(245,158,11,0.08)', marginBottom: '1.25rem' }}>
            <p style={{ fontSize: '11px', fontWeight: '700', color: '#f59e0b', letterSpacing: '1px', margin: '0 0 16px 0' }}>NEW REMINDER</p>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>What do you need to do?</label>
              <input
                placeholder="e.g. Call John Smith to follow up on listing"
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--lw-text-muted)', display: 'block', marginBottom: '6px' }}>When?</label>
              <input
                type="datetime-local"
                value={form.remind_at}
                onChange={e => setForm({ ...form, remind_at: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={addReminder} disabled={saving}
                style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg,#f59e0b,#d97706)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '12px 18px', background: 'var(--lw-input)', color: 'var(--lw-text-muted)', border: '1px solid var(--lw-border)', borderRadius: '10px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1rem' }}>
          {[
            { key: 'upcoming', label: `⏰ Upcoming (${upcoming.length})` },
            { key: 'overdue', label: `🔴 Overdue (${overdue.length})` },
            { key: 'completed', label: `✅ Done (${completed.length})` },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: 'pointer',
                fontWeight: activeTab === tab.key ? '700' : '500',
                borderColor: activeTab === tab.key ? '#f59e0b' : 'var(--lw-border)',
                background: activeTab === tab.key ? 'rgba(245,158,11,0.1)' : 'var(--lw-input)',
                color: activeTab === tab.key ? '#f59e0b' : 'var(--lw-text-muted)',
                fontFamily: 'var(--font-plus-jakarta), sans-serif'
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* REMINDERS LIST */}
        {loading ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--lw-text-muted)', fontWeight: '500' }}>Loading reminders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏰</div>
            <p style={{ color: 'var(--lw-text)', fontWeight: '700', marginBottom: '8px', fontSize: '15px' }}>
              {activeTab === 'upcoming' ? 'No upcoming reminders' : activeTab === 'overdue' ? 'No overdue reminders' : 'No completed reminders'}
            </p>
            <p style={{ color: 'var(--lw-text-muted)', fontSize: '13px', margin: 0 }}>
              {activeTab === 'upcoming' ? 'Add a reminder or ask the AI chat to set one for you.' : ''}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map(reminder => {
              const date = new Date(reminder.remind_at)
              const isOverdue = !reminder.sent && date < now
              return (
                <div key={reminder.id} style={{
                  background: 'var(--lw-card)', borderRadius: '14px', padding: '1.25rem 1.5rem',
                  border: isOverdue ? '1px solid rgba(239,68,68,0.25)' : '1px solid var(--lw-border)',
                  boxShadow: isOverdue ? '0 2px 12px rgba(239,68,68,0.06)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '14px', fontWeight: '600', color: reminder.sent ? 'var(--lw-text-muted)' : 'var(--lw-text)', margin: '0 0 6px', textDecoration: reminder.sent ? 'line-through' : 'none', lineHeight: '1.5' }}>
                        {reminder.content}
                      </p>
                      <p style={{ fontSize: '12px', color: isOverdue ? '#ef4444' : 'var(--lw-text-muted)', margin: '0', fontWeight: isOverdue ? '600' : '500' }}>
                        {isOverdue ? '🔴 Overdue · ' : '📅 '}
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      {!reminder.sent && (
                        <button onClick={() => markDone(reminder.id)}
                          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(29,158,117,0.3)', fontSize: '11px', cursor: 'pointer', background: 'rgba(29,158,117,0.08)', color: '#1D9E75', fontWeight: '700', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                          ✓ Done
                        </button>
                      )}
                      {!reminder.sent && (
                        <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(reminder.content)}&dates=${new Date(reminder.remind_at).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(new Date(reminder.remind_at).getTime() + 30 * 60000).toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent('Reminder from Listing Whisperer')}`}
                          target="_blank" rel="noopener noreferrer"
                          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(66,133,244,0.3)', fontSize: '11px', cursor: 'pointer', background: 'rgba(66,133,244,0.08)', color: '#4285f4', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          📅 Google
                        </a>
                      )}
                      <button onClick={() => deleteReminder(reminder.id)}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)', fontSize: '11px', cursor: 'pointer', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontWeight: '600', fontFamily: 'var(--font-plus-jakarta), sans-serif' }}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', paddingBottom: '2rem' }}>
          <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}
