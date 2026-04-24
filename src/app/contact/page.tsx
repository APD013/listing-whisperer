'use client'
import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', subject: '', message: '', type: 'General Question'
  })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.message) {
      alert('Please fill in all required fields!')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        setSent(true)
      } else {
        setLoading(false)
        return
      }
    } catch(e) {
      alert('Error sending message. Please try again.')
    }
    setLoading(false)
  }

  const inputStyle = { width:'100%', padding:'11px 14px', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'8px', fontSize:'14px', color:'#f0f0f0', boxSizing:'border-box' as const, outline:'none' }
  const labelStyle = { fontSize:'11px', fontWeight:'600' as const, color:'#6b7280', display:'block' as const, marginBottom:'5px', letterSpacing:'0.5px', textTransform:'uppercase' as const }

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'20%',left:'50%',transform:'translateX(-50%)',width:'600px',height:'600px',background:'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <nav style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 2rem',borderBottom:'1px solid rgba(255,255,255,0.06)',background:'rgba(13,17,23,0.8)',backdropFilter:'blur(10px)',position:'sticky',top:0,zIndex:100}}>
        <a href="/" style={{fontSize:'18px',fontWeight:'700',textDecoration:'none',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
        </a>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Home</a>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>Dashboard</a>
        </div>
      </nav>

      <div style={{maxWidth:'600px',margin:'0 auto',padding:'4rem 2rem'}}>

        {sent ? (
          <div style={{textAlign:'center',padding:'3rem 0'}}>
            <div style={{fontSize:'4rem',marginBottom:'1rem'}}>✅</div>
            <h2 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Message sent!</h2>
            <p style={{fontSize:'14px',color:'#6b7280',marginBottom:'2rem',lineHeight:'1.7'}}>
              Thanks for reaching out! We typically respond within 24 hours.
            </p>
            <a href="/dashboard" style={{display:'inline-block',padding:'12px 24px',background:'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',borderRadius:'10px',textDecoration:'none',fontSize:'14px',fontWeight:'600'}}>
              Back to Dashboard
            </a>
          </div>
        ) : (
          <div>
            {/* HEADER */}
            <div style={{textAlign:'center',marginBottom:'2.5rem'}}>
              <div style={{display:'inline-block',background:'rgba(29,158,117,0.1)',color:'#1D9E75',fontSize:'12px',fontWeight:'600',padding:'4px 14px',borderRadius:'20px',marginBottom:'1rem',border:'1px solid rgba(29,158,117,0.2)'}}>
                CONTACT US
              </div>
              <h1 style={{fontSize:'2rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'8px'}}>Get in touch</h1>
              <p style={{fontSize:'14px',color:'#6b7280',lineHeight:'1.7'}}>
                Have a question, feature request, or need help? We'd love to hear from you. We typically respond within 24 hours.
              </p>
            </div>

            {/* QUICK LINKS */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'2rem'}}>
              {[
                { icon: '💬', title: 'General Question', desc: 'Ask us anything' },
                { icon: '🐛', title: 'Report a Bug', desc: 'Something not working?' },
                { icon: '💡', title: 'Feature Request', desc: 'Suggest an improvement' },
              ].map(item => (
                <button key={item.title}
                  onClick={() => setForm({...form, type: item.title})}
                  style={{padding:'1rem',borderRadius:'12px',border:'1px solid',cursor:'pointer',textAlign:'center',transition:'all 0.15s',
                    borderColor: form.type === item.title ? '#1D9E75' : 'rgba(255,255,255,0.07)',
                    background: form.type === item.title ? 'rgba(29,158,117,0.15)' : 'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',
                    boxShadow: form.type === item.title ? '0 0 16px rgba(29,158,117,0.2)' : 'none'}}>
                  <div style={{fontSize:'1.5rem',marginBottom:'4px'}}>{item.icon}</div>
                  <div style={{fontSize:'12px',fontWeight:'600',color: form.type === item.title ? '#1D9E75' : '#f0f0f0',marginBottom:'2px'}}>{item.title}</div>
                  <div style={{fontSize:'11px',color:'#6b7280'}}>{item.desc}</div>
                </button>
              ))}
            </div>

            {/* FORM */}
            <div style={{background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.07)',padding:'2rem',boxShadow:'0 4px 24px rgba(0,0,0,0.3)'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div>
                  <label style={labelStyle}>Your Name *</label>
                  <input placeholder="Jane Smith" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={inputStyle}/>
                </div>
                <div>
                  <label style={labelStyle}>Email Address *</label>
                  <input type="email" placeholder="jane@email.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} style={inputStyle}/>
                </div>
              </div>

              <div style={{marginBottom:'12px'}}>
                <label style={labelStyle}>Subject</label>
                <input placeholder="What's this about?" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} style={inputStyle}/>
              </div>

              <div style={{marginBottom:'20px'}}>
                <label style={labelStyle}>Message *</label>
                <textarea
                  placeholder="Tell us what's on your mind... the more detail the better!"
                  value={form.message}
                  onChange={e=>setForm({...form,message:e.target.value})}
                  style={{...inputStyle, minHeight:'140px', resize:'vertical' as const}}
                />
              </div>

              <button onClick={handleSubmit} disabled={loading}
                style={{width:'100%',padding:'13px',background: loading ? '#085041' : 'linear-gradient(135deg,#1D9E75,#085041)',color:'#fff',border:'none',borderRadius:'10px',fontSize:'14px',fontWeight:'700',cursor: loading ? 'not-allowed' : 'pointer',boxShadow: loading ? 'none' : '0 0 24px rgba(29,158,117,0.3)',transition:'all 0.2s'}}>
                {loading ? 'Sending...' : 'Send Message →'}
              </button>

              <p style={{fontSize:'12px',color:'#444',textAlign:'center',marginTop:'12px'}}>
                We typically respond within 24 hours · <a href="mailto:hello@listingwhisperer.com" style={{color:'#1D9E75',textDecoration:'none'}}>hello@listingwhisperer.com</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}