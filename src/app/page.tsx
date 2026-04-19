export default function Home() {
  return (
    <main style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem',fontFamily:'sans-serif'}}>
      <h1 style={{fontSize:'2rem',fontWeight:'500',marginBottom:'1rem'}}>
        Listing<span style={{color:'#1D9E75'}}>Whisperer</span> AI
      </h1>
      <p style={{color:'#666',marginBottom:'2rem',textAlign:'center',maxWidth:'400px'}}>
        Turn property notes into polished marketing copy — in seconds.
      </p>
      <a href="/signup" style={{background:'#1D9E75',color:'#fff',padding:'12px 32px',borderRadius:'8px',textDecoration:'none',fontWeight:'500'}}>
        Get started free
      </a>
    </main>
  )
}