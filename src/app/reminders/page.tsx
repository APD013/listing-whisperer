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
    setReminders(prev => prev.map(r => r.id === id ? {...r, sent: true} : r))
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

  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)', marginBottom:'1rem' }
  const inputStyle = { width:'100%', padding:'11px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'13px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'rgba(26,29,46,0.8)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          {planLoaded && plan === 'pro' && (
            <span style={{marginLeft:'6px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',fontSize:'9px',fontWeight:'700',padding:'2px 7px',borderRadius:'20px',letterSpacing:'0.5px',verticalAlign:'middle',boxShadow:'0 0 10px rgba(29,158,117,0.4)'}}>PRO</span>
          )}
        </div>
        <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
      </div>

      <div style={{maxWidth:'680px',margin:'0 auto',padding:'2rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#1D9E75,#085041)',borderRadius:'16px',padding:'1.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 40px rgba(29,158,117,0.2)'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#fff',marginBottom:'6px'}}>⏰ Reminders</h1>
          <p style={{fontSize:'14px',color:'#a8f0d4',margin:'0',lineHeight:'1.6'}}>
            Never miss a follow-up. Set reminders from the chat or add them manually here.
          </p>
        </div>

        {/* STATS + ADD BUTTON */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'10px'}}>
          <div style={{display:'flex',gap:'16px'}}>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'1.5rem',fontWeight:'700',color:'#f87171',margin:'0'}}>{overdue.length}</p>
              <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Overdue</p>
            </div>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'1.5rem',fontWeight:'700',color:'#1D9E75',margin:'0'}}>{upcoming.length}</p>
              <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Upcoming</p>
            </div>
            <div style={{textAlign:'center'}}>
              <p style={{fontSize:'1.5rem',fontWeight:'700',color:'#6b7280',margin:'0'}}>{completed.length}</p>
              <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>Done</p>
            </div>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'600',cursor:'pointer',boxShadow:'0 0 16px rgba(29,158,117,0.3)'}}>
            + Add Reminder
          </button>
        </div>

        {/* ADD FORM */}
        {showForm && (
          <div style={{...cardStyle, border:'1px solid rgba(29,158,117,0.2)'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'#1D9E75',letterSpacing:'1px',marginBottom:'12px'}}>NEW REMINDER</p>
            <div style={{marginBottom:'12px'}}>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>What do you need to do?</label>
              <input placeholder="e.g. Call John Smith to follow up on listing" value={form.content} onChange={e => setForm({...form, content: e.target.value})} style={inputStyle}/>
            </div>
            <div style={{marginBottom:'16px'}}>
              <label style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',display:'block',marginBottom:'5px',letterSpacing:'0.5px',textTransform:'uppercase'}}>When?</label>
              <input type="datetime-local" value={form.remind_at} onChange={e => setForm({...form, remind_at: e.target.value})} style={inputStyle}/>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={addReminder} disabled={saving}
                style={{flex:1,padding:'11px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}}>
                {saving ? 'Saving...' : 'Save Reminder'}
              </button>
              <button onClick={() => setShowForm(false)}
                style={{padding:'11px 16px',background:'rgba(0,0,0,0.2)',color:'#6b7280',border:'1px solid rgba(255,255,255,0.08)',borderRadius:'8px',fontSize:'13px',cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={{display:'flex',gap:'6px',marginBottom:'1rem'}}>
          {[
            {key:'upcoming', label:`⏰ Upcoming (${upcoming.length})`},
            {key:'overdue', label:`🔴 Overdue (${overdue.length})`},
            {key:'completed', label:`✅ Done (${completed.length})`},
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              style={{padding:'7px 14px',borderRadius:'8px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontWeight: activeTab === tab.key ? '600' : '400',
                borderColor: activeTab === tab.key ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                background: activeTab === tab.key ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                color: activeTab === tab.key ? '#1D9E75' : '#6b7280'}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* REMINDERS LIST */}
        {loading ? (
          <div style={{...cardStyle, textAlign:'center', padding:'3rem'}}>
            <p style={{color:'#6b7280'}}>Loading reminders...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{...cardStyle, textAlign:'center', padding:'3rem'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>⏰</div>
            <p style={{color:'#f0f0f0',fontWeight:'600',marginBottom:'8px'}}>
              {activeTab === 'upcoming' ? 'No upcoming reminders' : activeTab === 'overdue' ? 'No overdue reminders' : 'No completed reminders'}
            </p>
            <p style={{color:'#6b7280',fontSize:'13px'}}>
              {activeTab === 'upcoming' ? 'Add a reminder or ask the AI chat to set one for you.' : ''}
            </p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
            {filtered.map(reminder => {
              const date = new Date(reminder.remind_at)
              const isOverdue = !reminder.sent && date < now
              return (
                <div key={reminder.id} style={{...cardStyle, marginBottom:'0', border: isOverdue ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(255,255,255,0.07)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
                    <div style={{flex:1}}>
                      <p style={{fontSize:'14px',fontWeight:'600',color: reminder.sent ? '#6b7280' : '#f0f0f0',margin:'0 0 6px',textDecoration: reminder.sent ? 'line-through' : 'none'}}>
                        {reminder.content}
                      </p>
                      <p style={{fontSize:'12px',color: isOverdue ? '#f87171' : '#6b7280',margin:'0',fontWeight: isOverdue ? '600' : '400'}}>
                        {isOverdue ? '🔴 Overdue · ' : '📅 '}{date.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'numeric', minute:'2-digit' })}
                      </p>
                    </div>
                    <div style={{display:'flex',gap:'6px',flexShrink:0}}>
                      {!reminder.sent && (
                        <button onClick={() => markDone(reminder.id)}
                          style={{padding:'5px 12px',borderRadius:'6px',border:'1px solid rgba(29,158,117,0.3)',fontSize:'11px',cursor:'pointer',background:'rgba(29,158,117,0.1)',color:'#1D9E75',fontWeight:'600'}}>
                          ✓ Done
                        </button>
                      )}
                      <button onClick={() => deleteReminder(reminder.id)}
                        style={{padding:'5px 12px',borderRadius:'6px',border:'1px solid rgba(239,68,68,0.2)',fontSize:'11px',cursor:'pointer',background:'rgba(239,68,68,0.1)',color:'#f87171'}}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div style={{textAlign:'center',marginTop:'2rem'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Back to Dashboard</a>
        </div>
      </div>
    </main>
  )
}