'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ADMIN_EMAIL = 'apd013@yahoo.com'

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) {
        router.push('/dashboard')
        return
      }
      setAuthorized(true)
      await loadData()
    }
    getUser()
  }, [])

  const loadData = async () => {
    setLoading(true)

    // Load all profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profiles) {
      setUsers(profiles)

      // Calculate stats
      const totalUsers = profiles.length
      const proUsers = profiles.filter(p => p.plan === 'pro').length
      const freeUsers = profiles.filter(p => p.plan === 'starter').length
      const totalListings = profiles.reduce((sum, p) => sum + (p.listings_used || 0), 0)
      const totalRewrites = profiles.reduce((sum, p) => sum + (p.rewrites_used || 0), 0)
      const activeUsers = profiles.filter(p => (p.listings_used || 0) > 0).length
      const usersWithCredits = profiles.filter(p => (p.listing_credits || 0) > 0).length
      const marketingOptIn = profiles.filter(p => p.marketing_emails).length

      setStats({
        totalUsers, proUsers, freeUsers, totalListings,
        totalRewrites, activeUsers, usersWithCredits, marketingOptIn,
        conversionRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0,
        activationRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
      })
    }
    setLoading(false)
  }

  const cardStyle = { background:'linear-gradient(135deg, #1a1d2e 0%, #1e2235 100%)', borderRadius:'16px', border:'1px solid rgba(255,255,255,0.07)', padding:'1.5rem', boxShadow:'0 4px 24px rgba(0,0,0,0.3)' }

  if (!authorized) return null

  return (
    <main style={{minHeight:'100vh',background:'linear-gradient(135deg, #0d1117 0%, #0f1420 100%)',fontFamily:"'Inter', sans-serif"}}>

      <div style={{position:'fixed',top:'10%',right:'10%',width:'400px',height:'400px',background:'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)',pointerEvents:'none'}}/>

      {/* NAV */}
      <div style={{background:'rgba(26,29,46,0.8)',backdropFilter:'blur(10px)',borderBottom:'1px solid rgba(255,255,255,0.06)',padding:'1rem 2rem',display:'flex',justifyContent:'space-between',alignItems:'center',position:'sticky',top:0,zIndex:100}}>
        <div style={{fontSize:'16px',fontWeight:'700',color:'#f0f0f0'}}>
          Listing<span style={{color:'#1D9E75'}}>Whisperer</span>
          <span style={{marginLeft:'8px',background:'rgba(239,68,68,0.2)',color:'#f87171',fontSize:'10px',fontWeight:'700',padding:'2px 8px',borderRadius:'20px',border:'1px solid rgba(239,68,68,0.3)'}}>ADMIN</span>
        </div>
        <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
          <a href="/dashboard" style={{fontSize:'13px',color:'#6b7280',textDecoration:'none'}}>← Dashboard</a>
          <button onClick={loadData} style={{fontSize:'12px',color:'#1D9E75',background:'none',border:'1px solid rgba(29,158,117,0.3)',borderRadius:'8px',padding:'6px 12px',cursor:'pointer'}}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={{maxWidth:'1000px',margin:'0 auto',padding:'2rem'}}>

        <div style={{marginBottom:'2rem'}}>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#f0f0f0',marginBottom:'6px'}}>📊 Admin Dashboard</h1>
          <p style={{fontSize:'14px',color:'#6b7280'}}>Real-time overview of Listing Whisperer</p>
        </div>

        {loading ? (
          <div style={{...cardStyle,textAlign:'center',padding:'3rem'}}>
            <p style={{color:'#6b7280'}}>Loading data...</p>
          </div>
        ) : stats && (
          <div>
            {/* STATS GRID */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:'12px',marginBottom:'1.5rem'}}>
              {[
                { label: 'Total Users', value: stats.totalUsers, color: '#f0f0f0', icon: '👥' },
                { label: 'Pro Users', value: stats.proUsers, color: '#1D9E75', icon: '⭐' },
                { label: 'Free Users', value: stats.freeUsers, color: '#8b8fa8', icon: '🆓' },
                { label: 'Active Users', value: stats.activeUsers, color: '#3b82f6', icon: '🔥' },
                { label: 'Listings Generated', value: stats.totalListings, color: '#f59e0b', icon: '🏠' },
                { label: 'Rewrites Used', value: stats.totalRewrites, color: '#8b5cf6', icon: '✨' },
                { label: 'Paid Credits', value: stats.usersWithCredits, color: '#10b981', icon: '💳' },
                { label: 'Email Opt-ins', value: stats.marketingOptIn, color: '#f0f0f0', icon: '📧' },
              ].map(stat => (
                <div key={stat.label} style={{...cardStyle,padding:'1.25rem',textAlign:'center'}}>
                  <div style={{fontSize:'1.5rem',marginBottom:'4px'}}>{stat.icon}</div>
                  <p style={{fontSize:'1.75rem',fontWeight:'700',color:stat.color,margin:'0 0 4px'}}>{stat.value}</p>
                  <p style={{fontSize:'11px',color:'#6b7280',margin:'0'}}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CONVERSION STATS */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'1.5rem'}}>
              <div style={{...cardStyle,textAlign:'center'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',letterSpacing:'1px',margin:'0 0 8px'}}>FREE → PRO CONVERSION</p>
                <p style={{fontSize:'2.5rem',fontWeight:'700',color:'#1D9E75',margin:'0 0 4px'}}>{stats.conversionRate}%</p>
                <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>{stats.proUsers} of {stats.totalUsers} users upgraded</p>
              </div>
              <div style={{...cardStyle,textAlign:'center'}}>
                <p style={{fontSize:'11px',fontWeight:'700',color:'#6b7280',letterSpacing:'1px',margin:'0 0 8px'}}>ACTIVATION RATE</p>
                <p style={{fontSize:'2.5rem',fontWeight:'700',color:'#3b82f6',margin:'0 0 4px'}}>{stats.activationRate}%</p>
                <p style={{fontSize:'12px',color:'#6b7280',margin:'0'}}>{stats.activeUsers} users generated at least 1 listing</p>
              </div>
            </div>

            {/* TABS */}
            <div style={{display:'flex',gap:'8px',marginBottom:'1rem'}}>
              {['overview', 'users', 'pro', 'inactive'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{padding:'8px 16px',borderRadius:'8px',border:'1px solid',fontSize:'12px',cursor:'pointer',fontWeight: activeTab === tab ? '600' : '400',
                    borderColor: activeTab === tab ? '#1D9E75' : 'rgba(255,255,255,0.08)',
                    background: activeTab === tab ? 'rgba(29,158,117,0.2)' : 'rgba(0,0,0,0.2)',
                    color: activeTab === tab ? '#1D9E75' : '#6b7280'}}>
                  {tab === 'overview' ? '📊 All Users' : tab === 'users' ? '🆓 Free Users' : tab === 'pro' ? '⭐ Pro Users' : '😴 Inactive'}
                </button>
              ))}
            </div>

            {/* USER TABLE */}
            <div style={cardStyle}>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                      {['Email','Plan','Listings','Rewrites','Credits','Email Opt-in','Joined'].map(h => (
                        <th key={h} style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',padding:'8px 12px',textAlign:'left',letterSpacing:'0.5px',textTransform:'uppercase',whiteSpace:'nowrap'}}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => {
                        if (activeTab === 'users') return u.plan === 'starter'
                        if (activeTab === 'pro') return u.plan === 'pro'
                        if (activeTab === 'inactive') return (u.listings_used || 0) === 0
                        return true
                      })
                      .map(user => (
                        <tr key={user.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}
                          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{padding:'10px 12px',fontSize:'13px',color:'#f0f0f0'}}>{user.email || '—'}</td>
                          <td style={{padding:'10px 12px'}}>
                            <span style={{fontSize:'11px',fontWeight:'600',padding:'2px 10px',borderRadius:'20px',
                              background: user.plan === 'pro' ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.05)',
                              color: user.plan === 'pro' ? '#1D9E75' : '#6b7280',
                              border: user.plan === 'pro' ? '1px solid rgba(29,158,117,0.3)' : '1px solid rgba(255,255,255,0.08)'}}>
                              {user.plan === 'pro' ? '⭐ Pro' : 'Free'}
                            </span>
                          </td>
                          <td style={{padding:'10px 12px',fontSize:'13px',color: (user.listings_used || 0) > 0 ? '#f0f0f0' : '#444'}}>{user.listings_used || 0}</td>
                          <td style={{padding:'10px 12px',fontSize:'13px',color: (user.rewrites_used || 0) > 0 ? '#f0f0f0' : '#444'}}>{user.rewrites_used || 0}</td>
                          <td style={{padding:'10px 12px',fontSize:'13px',color: (user.listing_credits || 0) > 0 ? '#1D9E75' : '#444'}}>{user.listing_credits || 0}</td>
                          <td style={{padding:'10px 12px',fontSize:'13px',color: user.marketing_emails ? '#1D9E75' : '#444'}}>{user.marketing_emails ? '✅' : '—'}</td>
                          <td style={{padding:'10px 12px',fontSize:'12px',color:'#6b7280',whiteSpace:'nowrap'}}>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}