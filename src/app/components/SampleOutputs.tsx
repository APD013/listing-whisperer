'use client'
import { useState } from 'react'

const sampleOutputs: Record<string, string> = {
  mls: `Welcome to this stunning 4-bedroom, 3-bath home nestled in the heart of Newport Beach. Spanning 2,200 sq ft of thoughtfully designed living space, this residence seamlessly blends coastal elegance with modern comfort. The chef's kitchen features quartz countertops, premium stainless appliances, and a large island perfect for entertaining. Retreat to the primary suite with spa-inspired bath and private ocean-view balcony. Three-car garage, solar panels, and smart home system included. Steps from top-rated schools, dining, and the beach. Priced at $1,295,000 — this one won't last.`,
  instagram: `🌊 Your dream coastal home just hit the market.\n\n4 beds · 3 baths · Ocean views · Chef's kitchen\nNewport Beach, CA — $1,295,000\n\nSwipe to see inside 👉\n\n#NewportBeach #LuxuryRealEstate #DreamHome #CoastalLiving #JustListed #RealEstate #HomesForSale #OceanView`,
  email: `Subject: Just Listed — Stunning Ocean View Home in Newport Beach\n\nHi [First Name],\n\nI wanted to reach out personally because a property just came to market that I think you'll love.\n\n4 bedrooms · 3 bathrooms · 2,200 sq ft\nNewport Beach, CA · Listed at $1,295,000\n\nThis home has everything on your list — ocean views, updated kitchen, and a primary suite that feels like a private retreat.\n\nI'd love to schedule a private showing before the weekend open house. Reply to this email or call me directly.\n\nBest,\n[Agent Name]`,
}

export default function SampleOutputs() {
  const [activeOutput, setActiveOutput] = useState('mls')

  return (
    <>
      <div style={{display:'flex',gap:'8px',justifyContent:'center',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {[{key:'mls',label:'MLS Description'},{key:'instagram',label:'Instagram'},{key:'email',label:'Email Blast'}].map(t => (
          <button key={t.key} onClick={() => setActiveOutput(t.key)}
            style={{padding:'8px 18px',borderRadius:'20px',border:'1px solid',fontSize:'13px',cursor:'pointer',
              borderColor: activeOutput === t.key ? '#1D9E75' : '#ddd',
              background: activeOutput === t.key ? '#E1F5EE' : '#fff',
              color: activeOutput === t.key ? '#085041' : '#666'}}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{background:'#f9fafb',borderRadius:'12px',padding:'1.5rem',border:'1px solid #eee'}}>
        <p style={{fontSize:'14px',lineHeight:'1.9',color:'#333',whiteSpace:'pre-wrap'}}>{sampleOutputs[activeOutput]}</p>
      </div>
    </>
  )
}