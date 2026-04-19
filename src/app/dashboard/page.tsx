export default function Dashboard() {
  return (
    <main style={{minHeight:'100vh',padding:'2rem',fontFamily:'sans-serif'}}>
      <h1 style={{fontSize:'1.5rem',fontWeight:'500',color:'#1D9E75'}}>
        Welcome to Listing Whisperer
      </h1>
      <p style={{color:'#666',marginTop:'0.5rem'}}>
        Your dashboard is ready!
      </p>
      <a href="/new-listing" style={{display:'inline-block',marginTop:'1.5rem',background:'#1D9E75',color:'#fff',padding:'12px 24px',borderRadius:'8px',textDecoration:'none',fontSize:'14px',fontWeight:'500'}}>
        Create your first listing
      </a>
    </main>
  )
}