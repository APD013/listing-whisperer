'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { trackEvent } from '../lib/analytics'
import AskAiHint from '../components/AskAiHint'

import Navbar from '../components/Navbar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function FollowUpAssistant() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [showReminderModal, setShowReminderModal] = useState<string | null>(null)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderSaved, setReminderSaved] = useState<string | null>(null)
  const [form, setForm] = useState({
    contactName: '',
    contactType: 'Seller lead',
    meetingType: 'Listing appointment',
    propertyAddress: '',
    keyPoints: '',
    nextStep: '',
    agentName: '',
    phone: '',
  })

  useEffect(() => {
    trackEvent('tool_page_view', { tool: 'follow_up' })
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  const styles = {
    page: { minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: "var(--font-plus-jakarta), sans-serif", color: 'var(--lw-text)' },
    card: { background: 'var(--lw-card)', borderRadius: '16px', border: '1px solid var(--lw-border)', padding: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: '1rem' },
    input: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', boxSizing: 'border-box' as const, outline: 'none' },
    select: { width: '100%', padding: '11px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)' },
    label: { fontSize: '11px', color: 'var(--lw-text-muted)', display: 'block' as const, marginBottom: '5px', fontWeight: '600' as const, letterSpacing: '0.3px', textTransform: 'uppercase' as const },
  }

  const sectionHeadStyle = {
    fontSize: '11px', fontWeight: '700' as const, color: 'var(--lw-text-muted)',
    letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: '12px',
  }

  const handleAddReminder = async (key: string, content: string, subject: string) => {
    if (!reminderDate) { alert('Please select a date and time for the reminder.'); return }
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contactName: form.contactName,
          reminderType: key,
          content,
          subject,
          remindAt: new Date(reminderDate).toISOString()
        })
      })
      const data = await res.json()
      if (data.success) {
        setReminderSaved(key)
        setShowReminderModal(null)
        setTimeout(() => setReminderSaved(null), 3000)
      }
    } catch(e: any) { alert('Error saving reminder: ' + e.message) }
  }

  const handleCopy = (key: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const generate = async () => {
    if (!form.contactName) { alert('Please fill in the contact name.'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form, userId })
      })
      const data = await res.json()
      if (data.result) setResult(data.result)
      else alert('Error: ' + (data.error || 'Something went wrong'))
    } catch(e: any) { alert('Error: ' + e.message) }
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={{position:'fixed',top:'10%',left:'5%',width:'380px',height:'380px',background:'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',pointerEvents:'none'}}/>
      <div style={{position:'fixed',bottom:'15%',right:'5%',width:'300px',height:'300px',background:'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      <Navbar />

      <div style={{maxWidth:'760px',margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* HERO */}
        <div style={{background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:'20px',padding:'2.5rem 2rem',marginBottom:'1.5rem',boxShadow:'0 0 60px rgba(99,102,241,0.25)',textAlign:'center'}}>
          <div style={{display:'inline-block',background:'rgba(255,255,255,0.15)',borderRadius:'20px',padding:'4px 14px',fontSize:'11px',fontWeight:'700',color:'rgba(255,255,255,0.9)',letterSpacing:'1px',marginBottom:'14px'}}>FOLLOW-UP ASSISTANT</div>
          <h1 style={{fontSize:'2rem',fontWeight:'800',color:'#fff',marginBottom:'10px',letterSpacing:'-0.03em',lineHeight:'1.2'}}>Follow up faster. Close more.</h1>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.88)',lineHeight:'1.7',maxWidth:'500px',margin:'0 auto 18px'}}>Post-meeting messages that keep you top of mind — email, text, LinkedIn, and a CRM note, all in one click.</p>
          <button onClick={() => document.getElementById('follow-up-form')?.scrollIntoView({ behavior: 'smooth' })}
            style={{background:'rgba(255,255,255,0.2)',border:'1.5px solid rgba(255,255,255,0.5)',color:'#fff',borderRadius:'10px',padding:'11px 28px',fontSize:'14px',fontWeight:'700',cursor:'pointer',backdropFilter:'blur(4px)'}}>
            Build My Follow-Up →
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>How It Works</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))',gap:'10px'}}>
            {[
              {s:'1',icon:'📩',title:'Enter meeting details',desc:'Add contact name, type, meeting type, and property address.'},
              {s:'2',icon:'📋',title:'Add key points',desc:'Describe what was discussed and the agreed next step.'},
              {s:'3',icon:'✉️',title:'Get your follow-up kit',desc:'5 messages ready to send across email, text, and LinkedIn.'},
            ].map(({s,icon,title,desc}) => (
              <div key={s} style={{background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'14px',padding:'1.1rem',display:'flex',flexDirection:'column',gap:'6px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
                  <span style={{width:'22px',height:'22px',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'800',color:'#fff',flexShrink:0}}>{s}</span>
                  <span style={{fontSize:'1rem'}}>{icon}</span>
                </div>
                <span style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',lineHeight:'1.4'}}>{title}</span>
                <span style={{fontSize:'12px',color:'var(--lw-text-muted)',lineHeight:'1.5'}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FORM */}
        <AskAiHint hint="Not sure what to say? Ask AI to write your follow-up →" />
        <div id="follow-up-form" style={{...styles.card, border:'1px solid rgba(99,102,241,0.15)', marginBottom:'1.5rem'}}>
          <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',margin:'0 0 16px',paddingBottom:'12px',borderBottom:'1px solid var(--lw-border)'}}>CONTACT & MEETING DETAILS</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',marginBottom:'16px'}}>
            <div>
              <label style={styles.label}>Contact Name</label>
              <input placeholder="John & Sarah Smith" value={form.contactName} onChange={e => setForm({...form, contactName: e.target.value})} style={styles.input}/>
            </div>
            <div>
              <label style={styles.label}>Contact Type</label>
              <select value={form.contactType} onChange={e => setForm({...form, contactType: e.target.value})} style={styles.select}>
                <option>Seller lead</option>
                <option>Buyer lead</option>
                <option>Open house attendee</option>
                <option>Past client</option>
                <option>Referral</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Meeting Type</label>
              <select value={form.meetingType} onChange={e => setForm({...form, meetingType: e.target.value})} style={styles.select}>
                <option>Listing appointment</option>
                <option>Buyer consultation</option>
                <option>Property showing</option>
                <option>Open house</option>
                <option>Phone call</option>
                <option>Networking event</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Property Address</label>
              <input placeholder="123 Oak Street, Newport Beach" value={form.propertyAddress} onChange={e => setForm({...form, propertyAddress: e.target.value})} style={styles.input}/>
            </div>
          </div>

          <div style={{borderTop:'1px solid var(--lw-border)',paddingTop:'16px',marginBottom:'16px'}}>
            <label style={styles.label}>Key points from the meeting</label>
            <textarea placeholder="What was discussed, what they liked, concerns raised, timeline, budget..." value={form.keyPoints} onChange={e => setForm({...form, keyPoints: e.target.value})}
              style={{...styles.input, minHeight:'80px', resize:'vertical' as const, marginBottom:'12px'}}/>
            <label style={styles.label}>Agreed next step</label>
            <input placeholder="Schedule second showing, send CMA, sign listing agreement..." value={form.nextStep} onChange={e => setForm({...form, nextStep: e.target.value})} style={styles.input}/>
          </div>

          <div style={{borderTop:'1px solid var(--lw-border)',paddingTop:'16px'}}>
            <p style={{fontSize:'11px',fontWeight:'700',color:'var(--lw-text-muted)',letterSpacing:'1px',margin:'0 0 12px'}}>AGENT INFO (OPTIONAL)</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
              <div>
                <label style={styles.label}>Agent Name</label>
                <input placeholder="Jane Smith" value={form.agentName} onChange={e => setForm({...form, agentName: e.target.value})} style={styles.input}/>
              </div>
              <div>
                <label style={styles.label}>Phone</label>
                <input placeholder="(949) 555-0123" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={styles.input}/>
              </div>
            </div>
          </div>
        </div>

        {/* WHAT YOU'LL GET */}
        <div style={{marginBottom:'1.5rem'}}>
          <p style={sectionHeadStyle}>What You'll Get</p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(210px, 1fr))',gap:'10px'}}>
            {[
              {icon:'📧',label:'Follow-Up Email',desc:'Professional email to send within 24 hours of the meeting.'},
              {icon:'💬',label:'Follow-Up Text',desc:'Casual SMS to send same day — short and personal.'},
              {icon:'💼',label:'LinkedIn Message',desc:'Professional connection follow-up for the right contacts.'},
              {icon:'📋',label:'CRM Note',desc:'Notes to add to your CRM and keep the relationship warm.'},
              {icon:'🎯',label:'Next Step Email',desc:'Email to confirm and advance the agreed next step.'},
            ].map(({icon,label,desc}) => (
              <div key={label} style={{background:'var(--lw-card)',border:'1px solid var(--lw-border)',borderRadius:'12px',padding:'14px',display:'flex',flexDirection:'column',gap:'5px'}}>
                <span style={{fontSize:'1.2rem'}}>{icon}</span>
                <span style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)'}}>{label}</span>
                <span style={{fontSize:'12px',color:'var(--lw-text-muted)',lineHeight:'1.5'}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button onClick={generate} disabled={loading}
          style={{width:'100%',padding:'16px',background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'16px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 40px rgba(99,102,241,0.35)',transition:'all 0.2s',marginBottom:'1.5rem'}}>
          {loading ? '⏳ Generating...' : '📩 Generate Follow-Up Kit'}
        </button>

        {/* LOADING */}
        {loading && (
          <div style={{...styles.card, padding:'1.25rem 1.5rem', display:'flex', alignItems:'center', gap:'12px'}}>
            <style>{`@keyframes pulse-dot { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }`}</style>
            <div style={{display:'flex',gap:'4px'}}>
              {[0,1,2].map(i => <div key={i} style={{width:'8px',height:'8px',borderRadius:'50%',background:'#6366f1',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>)}
            </div>
            <p style={{color:'var(--lw-text)',fontWeight:'600',fontSize:'13px',margin:'0',flex:1}}>Writing your follow-up messages...</p>
          </div>
        )}

        {/* REMINDER MODAL */}
        {showReminderModal && (
          <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.85)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
            <div style={{background:'var(--lw-card)',borderRadius:'20px',border:'1px solid rgba(212,175,55,0.3)',padding:'2rem',maxWidth:'420px',width:'100%',boxShadow:'0 0 60px rgba(212,175,55,0.1)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h3 style={{fontSize:'16px',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>⏰ Set a Reminder</h3>
                <button onClick={() => setShowReminderModal(null)} style={{background:'none',border:'none',color:'var(--lw-text-muted)',fontSize:'20px',cursor:'pointer'}}>✕</button>
              </div>
              <p style={{fontSize:'13px',color:'var(--lw-text-muted)',marginBottom:'1.5rem'}}>
                We'll email you a reminder to follow up with <strong style={{color:'var(--lw-text)'}}>{form.contactName}</strong>.
              </p>
              <label style={{fontSize:'11px',color:'var(--lw-text-muted)',display:'block',marginBottom:'6px',fontWeight:'600',letterSpacing:'0.3px',textTransform:'uppercase' as const}}>Remind me on</label>
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={e => setReminderDate(e.target.value)}
                style={{width:'100%',padding:'11px 14px',background:'var(--lw-input)',border:'1px solid var(--lw-border)',borderRadius:'8px',fontSize:'13px',color:'var(--lw-text)',boxSizing:'border-box' as const,outline:'none',marginBottom:'1.5rem'}}
              />
              <button
                onClick={() => {
                  const card = [
                    {key:'emailFollowUp', label:'Follow-Up Email'},
                    {key:'textFollowUp', label:'Follow-Up Text'},
                    {key:'linkedinMessage', label:'LinkedIn Message'},
                    {key:'reminderNote', label:'CRM Note'},
                    {key:'nextStepEmail', label:'Next Step Email'},
                  ].find(c => c.key === showReminderModal)
                  handleAddReminder(showReminderModal, result[showReminderModal], `Follow up with ${form.contactName} — ${card?.label}`)
                }}
                style={{width:'100%',padding:'12px',background:'linear-gradient(135deg,#d4af37,#a08040)',color:'#000',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'700',cursor:'pointer'}}>
                Set Reminder
              </button>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {result && !loading && (
          <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            {[
              { key: 'emailFollowUp', label: 'Follow-Up Email', icon: '📧', color: '#6366f1', desc: 'Professional email to send within 24 hours' },
              { key: 'textFollowUp', label: 'Follow-Up Text', icon: '💬', color: '#10b981', desc: 'Casual SMS to send same day' },
              { key: 'linkedinMessage', label: 'LinkedIn Message', icon: '💼', color: '#0a66c2', desc: 'Professional connection message' },
              { key: 'reminderNote', label: 'CRM Reminder Note', icon: '📋', color: '#d4af37', desc: 'Notes to add to your CRM for this contact' },
              { key: 'nextStepEmail', label: 'Next Step Email', icon: '🎯', color: '#1D9E75', desc: 'Email to confirm and advance the next step' },
            ].map(card => result[card.key] && (
              <div key={card.key} style={{...styles.card}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'12px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                    <div style={{width:'36px',height:'36px',borderRadius:'9px',background:`${card.color}15`,border:`1px solid ${card.color}25`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>{card.icon}</div>
                    <div>
                      <p style={{fontSize:'13px',fontWeight:'700',color:'var(--lw-text)',margin:'0'}}>{card.label}</p>
                      <p style={{fontSize:'11px',color:'var(--lw-text-muted)',margin:'0'}}>{card.desc}</p>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'6px'}}>
                    <button onClick={() => handleCopy(card.key, result[card.key])}
                      style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid',fontSize:'11px',cursor:'pointer',fontWeight:'500',background: copied === card.key ? card.color : 'var(--lw-input)',color: copied === card.key ? '#fff' : 'var(--lw-text-muted)',borderColor: copied === card.key ? card.color : 'var(--lw-border)'}}>
                      {copied === card.key ? '✓ Copied!' : '📋 Copy'}
                    </button>
                    <button onClick={() => setShowReminderModal(card.key)}
                      style={{padding:'5px 14px',borderRadius:'6px',border:'1px solid rgba(212,175,55,0.3)',fontSize:'11px',cursor:'pointer',fontWeight:'500',background: reminderSaved === card.key ? '#d4af37' : 'rgba(212,175,55,0.1)',color: reminderSaved === card.key ? '#000' : '#d4af37'}}>
                      {reminderSaved === card.key ? '✓ Reminder Set!' : '⏰ Remind Me'}
                    </button>
                  </div>
                </div>
                <p style={{fontSize:'13px',lineHeight:'1.85',color:'var(--lw-text)',margin:'0',whiteSpace:'pre-wrap'}}>{result[card.key]}</p>
              </div>
            ))}
            <div style={{display:'flex',gap:'10px',flexWrap:'wrap',paddingTop:'8px'}}>
              <a href="/dashboard" style={{padding:'10px 20px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'13px',fontWeight:'600'}}>← Back to Dashboard</a>
              <button onClick={() => { setResult(null); window.scrollTo({top:0,behavior:'smooth'}) }}
                style={{padding:'10px 20px',background:'var(--lw-input)',color:'var(--lw-text-muted)',borderRadius:'10px',border:'1px solid var(--lw-border)',fontSize:'13px',cursor:'pointer'}}>
                ↺ New Follow-Up
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
