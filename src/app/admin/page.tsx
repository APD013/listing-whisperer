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
  const [listings, setListings] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || user.email !== ADMIN_EMAIL) { router.push('/dashboard'); return }
      setAuthorized(true)
      await loadData()
    }
    getUser()
  }, [])

  const loadData = async () => {
    setLoading(true)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    const { data: allListings } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (profiles) {
      setUsers(profiles)
      if (allListings) setListings(allListings)

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const totalUsers = profiles.length
      const proUsers = profiles.filter(p => p.plan === 'pro').length
      const freeUsers = profiles.filter(p => p.plan === 'starter').length
      const totalListings = profiles.reduce((sum, p) => sum + (p.listings_used || 0), 0)
      const totalRewrites = profiles.reduce((sum, p) => sum + (p.rewrites_used || 0), 0)
      const activeUsers = profiles.filter(p => (p.listings_used || 0) > 0).length
      const marketingOptIn = profiles.filter(p => p.marketing_emails).length
      const newToday = profiles.filter(p => new Date(p.created_at) >= today).length
      const newThisWeek = profiles.filter(p => new Date(p.created_at) >= thisWeek).length
      const newThisMonth = profiles.filter(p => new Date(p.created_at) >= thisMonth).length
      const mrr = proUsers * 20
      const trialUsers = profiles.filter(p => {
        if (p.plan !== 'starter') return false
        const created = new Date(p.created_at)
        const hoursSince = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
        return hoursSince < 24
      }).length

      setStats({
        totalUsers, proUsers, freeUsers, totalListings, totalRewrites,
        activeUsers, marketingOptIn, newToday, newThisWeek, newThisMonth,
        mrr, trialUsers,
        conversionRate: totalUsers > 0 ? ((proUsers / totalUsers) * 100).toFixed(1) : 0,
        activationRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
        avgListingsPerUser: activeUsers > 0 ? (totalListings / activeUsers).toFixed(1) : 0,
      })
    }
    setLoading(false)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = !searchQuery ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
    if (activeTab === 'free') return u.plan === 'starter' && matchesSearch
    if (activeTab === 'pro') return u.plan === 'pro' && matchesSearch
    if (activeTab === 'inactive') return (u.listings_used || 0) === 0 && matchesSearch
    if (activeTab === 'trial') {
      const hoursSince = (new Date().getTime() - new Date(u.created_at).getTime()) / (1000 * 60 * 60)
      return hoursSince < 24 && u.plan === 'starter' && matchesSearch
    }
    return matchesSearch
  })

  const cardStyle = {
    background: 'var(--lw-card)',
    borderRadius: '16px',
    border: '1px solid var(--lw-border)',
    padding: '1.5rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  }

  if (!authorized) return null

  return (
    <main style={{ minHeight: '100vh', background: 'var(--lw-bg)', fontFamily: "var(--font-plus-jakarta), sans-serif" }}>

      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(29,158,117,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* NAV */}
      <div style={{ background: 'var(--lw-card)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--lw-border)', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/dashboard" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--lw-text-muted)', textDecoration: 'none' }}>← Dashboard</a>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={loadData} style={{ fontSize: '12px', color: '#1D9E75', background: 'none', border: '1px solid rgba(29,158,117,0.3)', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
            🔄 Refresh
          </button>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--lw-text)', letterSpacing: '-0.02em' }}>
            Listing<span style={{ color: '#1D9E75' }}>Whisperer</span>
            <span style={{ marginLeft: '8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.3)' }}>ADMIN</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem' }}>

        {/* HERO */}
        <div style={{ background: 'linear-gradient(135deg,#1D9E75,#085041)', borderRadius: '20px', padding: '2.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 60px rgba(29,158,117,0.25)', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.15)', borderRadius: '20px', padding: '4px 14px', fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: '1px', marginBottom: '14px' }}>ADMIN DASHBOARD</div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', color: '#fff', marginBottom: '10px', letterSpacing: '-0.03em', lineHeight: '1.2' }}>Admin Dashboard</h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', lineHeight: '1.7', maxWidth: '500px', margin: '0 auto 18px' }}>User metrics, revenue, and platform activity</p>
          <button onClick={() => document.getElementById('user-table')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.5)', color: '#fff', borderRadius: '10px', padding: '11px 28px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
            View Users →
          </button>
        </div>

        {loading ? (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--lw-text-muted)', fontWeight: '500' }}>Loading data...</p>
          </div>
        ) : stats && (
          <div>

            {/* MRR HERO */}
            <div style={{ background: 'linear-gradient(135deg,#1D9E75,#085041)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '1.5rem', boxShadow: '0 0 40px rgba(29,158,117,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#a8f0d4', letterSpacing: '1px', margin: '0 0 6px' }}>MONTHLY RECURRING REVENUE</p>
                <p style={{ fontSize: '3rem', fontWeight: '800', color: '#fff', margin: '0', letterSpacing: '-1px' }}>${stats.mrr}<span style={{ fontSize: '16px', fontWeight: '400', opacity: 0.7 }}>/mo</span></p>
                <p style={{ fontSize: '13px', color: '#a8f0d4', margin: '6px 0 0' }}>{stats.proUsers} Pro users × $20/mo</p>
              </div>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: '0' }}>{stats.newToday}</p>
                  <p style={{ fontSize: '11px', color: '#a8f0d4', margin: '0' }}>New Today</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: '0' }}>{stats.newThisWeek}</p>
                  <p style={{ fontSize: '11px', color: '#a8f0d4', margin: '0' }}>This Week</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: '0' }}>{stats.newThisMonth}</p>
                  <p style={{ fontSize: '11px', color: '#a8f0d4', margin: '0' }}>This Month</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '2rem', fontWeight: '700', color: '#fff', margin: '0' }}>{stats.trialUsers}</p>
                  <p style={{ fontSize: '11px', color: '#a8f0d4', margin: '0' }}>In Trial Now</p>
                </div>
              </div>
            </div>

            {/* STATS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, color: 'var(--lw-text)', icon: '👥' },
                { label: 'Pro Users', value: stats.proUsers, color: '#1D9E75', icon: '⭐' },
                { label: 'Free Users', value: stats.freeUsers, color: 'var(--lw-text-muted)', icon: '🆓' },
                { label: 'Active Users', value: stats.activeUsers, color: '#3b82f6', icon: '🔥' },
                { label: 'Listings Generated', value: stats.totalListings, color: '#f59e0b', icon: '🏠' },
                { label: 'Avg Per User', value: stats.avgListingsPerUser, color: '#f59e0b', icon: '📊' },
                { label: 'Rewrites Used', value: stats.totalRewrites, color: '#8b5cf6', icon: '✨' },
                { label: 'Email Opt-ins', value: stats.marketingOptIn, color: '#10b981', icon: '📧' },
              ].map(stat => (
                <div key={stat.label} style={{ ...cardStyle, padding: '1.25rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{stat.icon}</div>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: stat.color, margin: '0 0 4px' }}>{stat.value}</p>
                  <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '0' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* CONVERSION + ACTIVATION */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '1.5rem' }}>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1px', margin: '0 0 8px' }}>FREE → PRO CONVERSION</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#1D9E75', margin: '0 0 4px' }}>{stats.conversionRate}%</p>
                <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: '0' }}>{stats.proUsers} of {stats.totalUsers} upgraded</p>
                <div style={{ marginTop: '10px', background: 'var(--lw-input)', borderRadius: '20px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#1D9E75', width: `${stats.conversionRate}%`, borderRadius: '20px' }} />
                </div>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1px', margin: '0 0 8px' }}>ACTIVATION RATE</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3b82f6', margin: '0 0 4px' }}>{stats.activationRate}%</p>
                <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: '0' }}>{stats.activeUsers} generated 1+ listing</p>
                <div style={{ marginTop: '10px', background: 'var(--lw-input)', borderRadius: '20px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#3b82f6', width: `${stats.activationRate}%`, borderRadius: '20px' }} />
                </div>
              </div>
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--lw-text-muted)', letterSpacing: '1px', margin: '0 0 8px' }}>TRIAL → PRO TARGET</p>
                <p style={{ fontSize: '2.5rem', fontWeight: '700', color: '#d4af37', margin: '0 0 4px' }}>5%</p>
                <p style={{ fontSize: '12px', color: 'var(--lw-text-muted)', margin: '0' }}>Industry avg is 2-5%</p>
                <div style={{ marginTop: '10px', background: 'var(--lw-input)', borderRadius: '20px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#d4af37', width: `${Math.min(stats.conversionRate, 100)}%`, borderRadius: '20px' }} />
                </div>
              </div>
            </div>

            {/* USER TABLE */}
            <div id="user-table" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { key: 'overview', label: '👥 All', count: users.length },
                  { key: 'pro', label: '⭐ Pro', count: stats.proUsers },
                  { key: 'free', label: '🆓 Free', count: stats.freeUsers },
                  { key: 'trial', label: '⏰ In Trial', count: stats.trialUsers },
                  { key: 'inactive', label: '😴 Inactive', count: users.filter(u => (u.listings_used || 0) === 0).length },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid', fontSize: '12px', cursor: 'pointer', fontWeight: activeTab === tab.key ? '600' : '400', fontFamily: "var(--font-plus-jakarta), sans-serif",
                      borderColor: activeTab === tab.key ? '#1D9E75' : 'var(--lw-border)',
                      background: activeTab === tab.key ? 'rgba(29,158,117,0.15)' : 'var(--lw-input)',
                      color: activeTab === tab.key ? '#1D9E75' : 'var(--lw-text-muted)' }}>
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
              <input
                placeholder="Search by email or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 14px', background: 'var(--lw-input)', border: '1px solid var(--lw-border)', borderRadius: '8px', fontSize: '13px', color: 'var(--lw-text)', outline: 'none', width: '220px', fontFamily: "var(--font-plus-jakarta), sans-serif" }}
              />
            </div>

            <div style={cardStyle}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--lw-border)' }}>
                      {['Name / Email', 'Plan', 'Listings', 'Rewrites', 'Email Opt-in', 'Portfolio', 'Joined'].map(h => (
                        <th key={h} style={{ fontSize: '11px', fontWeight: '600', color: 'var(--lw-text-muted)', padding: '8px 12px', textAlign: 'left', letterSpacing: '0.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const hoursSince = (new Date().getTime() - new Date(user.created_at).getTime()) / (1000 * 60 * 60)
                      const inTrial = hoursSince < 24 && user.plan === 'starter'
                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--lw-border)' }}
                          onMouseOver={e => (e.currentTarget.style.background = 'var(--lw-input)')}
                          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: '10px 12px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--lw-text)', margin: '0', fontWeight: '500' }}>{user.full_name || '—'}</p>
                            <p style={{ fontSize: '11px', color: 'var(--lw-text-muted)', margin: '2px 0 0' }}>{user.email || '—'}</p>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '600', padding: '2px 10px', borderRadius: '20px',
                              background: user.plan === 'pro' ? 'rgba(29,158,117,0.15)' : inTrial ? 'rgba(212,175,55,0.15)' : 'var(--lw-input)',
                              color: user.plan === 'pro' ? '#1D9E75' : inTrial ? '#d4af37' : 'var(--lw-text-muted)',
                              border: user.plan === 'pro' ? '1px solid rgba(29,158,117,0.3)' : inTrial ? '1px solid rgba(212,175,55,0.3)' : '1px solid var(--lw-border)' }}>
                              {user.plan === 'pro' ? '⭐ Pro' : inTrial ? '⏰ Trial' : 'Free'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: (user.listings_used || 0) > 0 ? '#f59e0b' : 'var(--lw-border)', fontWeight: (user.listings_used || 0) > 0 ? '600' : '400' }}>{user.listings_used || 0}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: (user.rewrites_used || 0) > 0 ? '#8b5cf6' : 'var(--lw-border)' }}>{user.rewrites_used || 0}</td>
                          <td style={{ padding: '10px 12px', fontSize: '13px', color: user.marketing_emails ? '#1D9E75' : 'var(--lw-border)' }}>{user.marketing_emails ? '✅' : '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: user.portfolio_slug ? '#1D9E75' : 'var(--lw-border)' }}>{user.portfolio_slug || '—'}</td>
                          <td style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--lw-text-muted)', whiteSpace: 'nowrap' }}>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                            {inTrial && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#d4af37', fontWeight: '600' }}>ACTIVE TRIAL</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && (
                  <p style={{ textAlign: 'center', color: 'var(--lw-text-muted)', padding: '2rem', fontSize: '13px' }}>No users found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
