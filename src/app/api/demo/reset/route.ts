import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const DEMO_USER_ID = 'c8c428ac-eca7-487f-af9d-576544dc8e12'

export async function GET(request: Request) {
  const auth = request.headers.get('Authorization')
  if (auth !== 'Bearer lw-cron-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await Promise.all([
    supabase.from('listings').delete().eq('user_id', DEMO_USER_ID),
    supabase.from('leads').delete().eq('user_id', DEMO_USER_ID),
    supabase.from('reminders').delete().eq('user_id', DEMO_USER_ID),
  ])

  const now = new Date()
  const d1 = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const d2 = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const d3 = new Date(now.getTime() + 72 * 60 * 60 * 1000)

  await supabase.from('listings').insert([
    {
      user_id: DEMO_USER_ID,
      name: '245 Seagate Drive',
      property_type: 'Single family',
      beds_baths: '4 beds / 3 baths',
      sqft: '2,200',
      price: '$1,295,000',
      neighborhood: 'Newport Beach, CA',
      features: 'Ocean views, chef kitchen, spa bath, 3-car garage, solar panels',
      tone: 'Luxury & aspirational',
      target_buyer: 'Luxury buyers',
      notes: 'Motivated seller, showing by appointment only',
      outputs: {
        mls_standard: "Welcome to this stunning 4-bedroom, 3-bath home nestled in the heart of Newport Beach. Spanning 2,200 sq ft of thoughtfully designed living space, this residence seamlessly blends coastal elegance with modern comfort. The chef's kitchen features quartz countertops, premium stainless appliances, and a large island perfect for entertaining. Retreat to the primary suite with spa-inspired bath and private ocean-view balcony. Three-car garage, solar panels, and smart home system included. Steps from top-rated schools, dining, and the beach. Priced at $1,295,000 — this one won't last.",
        mls_luxury: "An extraordinary coastal retreat awaits at 245 Seagate Drive — where panoramic ocean views, curated finishes, and effortless California living converge. This 4-bedroom, 3-bath masterpiece spans 2,200 sq ft of refined elegance. A chef's kitchen outfitted with top-tier appliances anchors the heart of the home, while the primary suite offers a spa-caliber bath and private balcony with sweeping Pacific views. The three-car garage, solar infrastructure, and smart home integration complete the picture. Priced at $1,295,000.",
        instagram: "🌊 Your dream coastal home just hit the market.\n\n4 beds · 3 baths · Ocean views · Chef's kitchen\nNewport Beach, CA — $1,295,000\n\nSwipe to see inside 👉\n\n#NewportBeach #LuxuryRealEstate #DreamHome #CoastalLiving #JustListed\n---\n✨ Just Listed in Newport Beach!\n\nWake up to the ocean every morning from your private balcony 🌅\n\n4BD | 3BA | 2,200 SF | $1,295,000\n\n#JustListed #CoastalHome #OceanViews #NewportBeach",
        facebook: "Just listed in Newport Beach! 🏡🌊\n\nThis stunning 4-bedroom, 3-bath home at 245 Seagate Drive is everything you've been waiting for — ocean views, chef's kitchen, spa bath, and a 3-car garage. All on 2,200 sq ft.\n\nListed at $1,295,000. Open house this weekend — message me for details.",
        email: "Subject: Just Listed — Stunning Ocean View Home in Newport Beach\n\nHi [First Name],\n\nA property just came to market that I think you'll love.\n\n4 bedrooms · 3 bathrooms · 2,200 sq ft\nNewport Beach, CA · Listed at $1,295,000\n\nOcean views, updated kitchen, and a primary suite that feels like a private retreat.\n\nReply to schedule a private showing before the weekend open house.",
        openhouse: "Open House This Weekend!\n\n📍 245 Seagate Drive, Newport Beach, CA\n🗓️ Saturday & Sunday · 1–4 PM\n\n4 beds · 3 baths · 2,200 sq ft · $1,295,000\nOcean views · Chef's kitchen · Spa bath\n\nRefreshments will be served. Come experience Newport Beach living at its finest.",
        video: "[OPENING SHOT: Aerial view of Newport Beach coastline]\nNarrator: \"Imagine waking up to this every morning.\"\n[CUT TO: Ocean-view balcony]\n\"245 Seagate Drive — a 4-bedroom, 3-bath masterpiece in Newport Beach.\"\n[CUT TO: Kitchen walkthrough]\n\"Chef's kitchen. Spa bath. Three-car garage.\"\n[CUT TO: Price card]\n\"Listed at $1,295,000. Call today for a private showing.\"",
        seo: "SEO Title: 4BR Ocean View Home for Sale in Newport Beach CA | $1,295,000\nMeta Description: Stunning 4-bedroom, 3-bath home in Newport Beach with panoramic ocean views, chef's kitchen, spa bath, and 3-car garage. 2,200 sq ft listed at $1,295,000.",
        text_message: "New listing Newport Beach! 4BD/3BA ocean views, $1.295M. Showing this wknd — interested? Reply YES 🌊\n---\nHey [Name]! A stunning coastal home just hit the market — 4 beds, ocean views, $1,295,000. Want details?",
        flyer: "JUST LISTED | Ocean Views in Newport Beach | 4 Bedrooms, 3 Baths, 2,200 Sq Ft | Chef's Kitchen with Quartz Countertops | Spa-Inspired Primary Suite | Private Ocean-View Balcony | 3-Car Garage + Solar Panels | $1,295,000",
        price_drop: "PRICE IMPROVEMENT: 245 Seagate Drive, Newport Beach — Now listed at $1,249,000 (reduced from $1,295,000). This is your chance to own a 4-bedroom coastal retreat with ocean views, chef's kitchen, and spa bath. Motivated seller, bring all offers.",
      }
    },
    {
      user_id: DEMO_USER_ID,
      name: '1810 Wilshire Blvd #504',
      property_type: 'Condo',
      beds_baths: '2 beds / 2 baths',
      sqft: '1,100',
      price: '$785,000',
      neighborhood: 'Santa Monica, CA',
      features: 'City views, rooftop pool, concierge, walkable to beach, updated finishes',
      tone: 'Modern & minimal',
      target_buyer: 'First-time buyers',
      notes: 'HOA includes water and trash',
      outputs: {
        mls_standard: "Urban sophistication meets coastal lifestyle at 1810 Wilshire Blvd #504. This beautifully updated 2-bedroom, 2-bath condo in the heart of Santa Monica offers sweeping city views, a designer kitchen, and open-plan living across 1,100 sq ft. Building amenities include a rooftop pool, concierge service, and secure parking. Walk to the beach, Third Street Promenade, and world-class dining. Priced at $785,000.",
        mls_luxury: "Elevated urban living in the most sought-after zip code on the Westside. Unit #504 at 1810 Wilshire offers a curated 2-bedroom, 2-bath layout with floor-to-ceiling windows, premium finishes, and panoramic city views. The rooftop pool and full-service concierge set the tone for a lifestyle without compromise. Steps from Santa Monica's best beaches, boutiques, and restaurants. Priced at $785,000.",
        instagram: "🌆 City views. Beach blocks away. This is Santa Monica living.\n\n2 beds · 2 baths · Rooftop pool · Concierge\n1810 Wilshire #504 — $785,000\n\n#SantaMonica #CondoLife #JustListed #WestLALiving",
        facebook: "Santa Monica condo alert! 🌊🌆\n\nUnit #504 at 1810 Wilshire Blvd just hit the market — 2 bedrooms, 2 baths, rooftop pool, and city views. Walking distance to the beach. Listed at $785,000. Message me for a showing!",
        email: "Subject: New Listing — Modern Condo in Santa Monica\n\nHi [First Name],\n\nIf you've been looking for the perfect Santa Monica condo, this one is worth a look.\n\n2 bedrooms · 2 bathrooms · 1,100 sq ft\nSanta Monica, CA · Listed at $785,000\n\nRooftop pool, concierge, city views, and walkable to the beach.\n\nReply to schedule a tour this week.",
        openhouse: "Open House Sunday!\n\n📍 1810 Wilshire Blvd #504, Santa Monica\n🗓️ Sunday · 12–3 PM\n\n2 beds · 2 baths · 1,100 sq ft · $785,000\nRooftop pool · Concierge · City views",
        video: "[OPENING SHOT: City skyline from the balcony]\nNarrator: \"Santa Monica from above.\"\n\"2 bedrooms, 2 baths — designed for how you actually live.\"\n[CUT TO: Rooftop pool]\n\"Rooftop pool. Full concierge. Walk to the beach.\"\n\"1810 Wilshire Blvd #504 — $785,000.\"",
        seo: "SEO Title: 2BR Condo for Sale in Santa Monica CA | Rooftop Pool | $785,000\nMeta Description: Modern 2-bedroom, 2-bath condo in Santa Monica with city views, rooftop pool, and concierge. 1,100 sq ft listed at $785,000. Walk to the beach.",
        text_message: "Santa Monica condo just listed! 2BD/2BA, rooftop pool, $785K. Want a showing? Reply YES 🏊\n---\nHey [Name]! Hot new condo in Santa Monica — 2 beds, city views, beach walkable. $785,000. Interested?",
        flyer: "JUST LISTED | Modern Condo in Santa Monica | 2 Bedrooms, 2 Baths, 1,100 Sq Ft | Panoramic City Views | Rooftop Pool & Concierge | Designer Kitchen with Updated Finishes | Walk to Beach & Third Street Promenade | $785,000",
        price_drop: "PRICE IMPROVEMENT: 1810 Wilshire Blvd #504, Santa Monica — Now $749,000 (reduced from $785,000). Prime Santa Monica location, 2BD/2BA, rooftop pool, concierge. Don't miss this window.",
      }
    },
    {
      user_id: DEMO_USER_ID,
      name: '3312 Elm Street',
      property_type: 'Townhome',
      beds_baths: '3 beds / 2.5 baths',
      sqft: '1,800',
      price: '$925,000',
      neighborhood: 'Pasadena, CA',
      features: 'Private patio, attached 2-car garage, updated kitchen, great school district',
      tone: 'Warm & inviting',
      target_buyer: 'Move-up families',
      notes: 'Move-in ready, HOA $350/month',
      outputs: {
        mls_standard: "Welcome home to 3312 Elm Street — a beautifully maintained 3-bedroom, 2.5-bath townhome in one of Pasadena's most desirable neighborhoods. Spanning 1,800 sq ft, this move-in-ready residence features an updated kitchen with quartz countertops, open living and dining areas, and a private patio perfect for outdoor entertaining. Attached 2-car garage, in-unit laundry, and top-rated schools just minutes away. HOA includes landscaping and exterior maintenance. Listed at $925,000.",
        mls_luxury: "Nestled in a charming Pasadena enclave, 3312 Elm Street is a 3-bedroom, 2.5-bath townhome where comfort and style intersect. The updated kitchen, private patio, and spacious layout across 1,800 sq ft make this an ideal family retreat. Attached 2-car garage, excellent schools, and a well-maintained HOA community. Listed at $925,000 — ready for immediate move-in.",
        instagram: "🍂 Move-in ready in Pasadena — and it's everything.\n\n3 beds · 2.5 baths · Private patio · Great schools\n3312 Elm Street — $925,000\n\n#Pasadena #JustListed #FamilyHome #MoveInReady",
        facebook: "Just listed in Pasadena! 🏡\n\n3312 Elm Street is a gorgeous 3-bedroom, 2.5-bath townhome with updated kitchen, private patio, and attached 2-car garage. Move-in ready, great schools, $925,000. Message me to book a showing!",
        email: "Subject: Just Listed in Pasadena — Move-In Ready Townhome\n\nHi [First Name],\n\nThis Pasadena townhome just hit the market and checks all the boxes.\n\n3 bedrooms · 2.5 bathrooms · 1,800 sq ft\nPasadena, CA · Listed at $925,000\n\nUpdated kitchen, private patio, attached garage — and move-in ready.\n\nReply if you'd like to tour before the weekend.",
        openhouse: "Open House This Saturday!\n\n📍 3312 Elm Street, Pasadena, CA\n🗓️ Saturday · 2–5 PM\n\n3 beds · 2.5 baths · 1,800 sq ft · $925,000\nUpdated kitchen · Private patio · Top-rated schools",
        video: "[OPENING SHOT: Tree-lined street in Pasadena]\nNarrator: \"This is the one you've been waiting for.\"\n[CUT TO: Kitchen with quartz countertops]\n\"3 bedrooms, 2.5 baths — move-in ready.\"\n[CUT TO: Private patio]\n\"Private patio, attached garage, top schools nearby.\"\n\"3312 Elm Street, Pasadena — $925,000.\"",
        seo: "SEO Title: 3BR Townhome for Sale in Pasadena CA | Move-In Ready | $925,000\nMeta Description: Beautiful 3-bedroom, 2.5-bath townhome in Pasadena with updated kitchen, private patio, and attached garage. 1,800 sq ft, great schools, $925,000.",
        text_message: "New Pasadena townhome! 3BD/2.5BA, updated kitchen, great schools, $925K. Want info? Reply YES 🏡\n---\nHey [Name]! Gorgeous move-in-ready townhome just listed in Pasadena — 3 beds, private patio, $925,000. Interested?",
        flyer: "JUST LISTED | Move-In Ready Townhome in Pasadena | 3 Bedrooms, 2.5 Baths, 1,800 Sq Ft | Updated Kitchen with Quartz Countertops | Private Patio & Outdoor Entertaining Space | Attached 2-Car Garage | Top-Rated School District | $925,000",
        price_drop: "PRICE IMPROVEMENT: 3312 Elm Street, Pasadena — Now $895,000 (reduced from $925,000). Move-in-ready 3BD townhome, updated kitchen, private patio. Best value in Pasadena right now.",
      }
    },
  ])

  await supabase.from('leads').insert([
    { user_id: DEMO_USER_ID, name: 'Sarah Mitchell', email: 'sarah.mitchell@example.com', phone: '(310) 555-0192', status: 'Meeting Scheduled', notes: "Looking for a 3BR in Pasadena, budget $900K–$1M. Has a house to sell first.", est_price: '$950,000' },
    { user_id: DEMO_USER_ID, name: 'James & Linda Park', email: 'jpark@example.com', phone: '(626) 555-0843', status: 'New Lead', notes: 'Referred by Tom Chen. Relocating from Seattle, need something by August.', est_price: '$800,000' },
    { user_id: DEMO_USER_ID, name: 'Marcus Webb', email: 'marcus.webb@example.com', phone: '(949) 555-0271', status: 'Under Contract', notes: '245 Seagate offer accepted. Closing in 30 days.', est_price: '$1,295,000' },
    { user_id: DEMO_USER_ID, name: 'Priya Sharma', email: 'priya.s@example.com', phone: '(310) 555-0419', status: 'Listed', notes: 'Seller at 1810 Wilshire. Motivated — needs to close by end of quarter.', est_price: '$785,000' },
    { user_id: DEMO_USER_ID, name: 'Tom & Carol Chen', email: 'tomchen@example.com', phone: '(818) 555-0667', status: 'New Lead', notes: 'Empty nesters, want to downsize to Santa Monica area. No rush.', est_price: '$700,000' },
  ])

  await supabase.from('reminders').insert([
    { user_id: DEMO_USER_ID, contact_name: 'Sarah Mitchell', reminder_type: 'Follow-up', subject: 'Send listing comps for Pasadena', content: "Send over the 3 comparable listings we discussed. She's meeting with her husband tonight.", remind_at: d1.toISOString(), sent: false },
    { user_id: DEMO_USER_ID, contact_name: 'Marcus Webb', reminder_type: 'Transaction', subject: 'Request inspection report', content: 'Inspection scheduled for Tuesday. Follow up with inspector for report by EOD Wednesday.', remind_at: d2.toISOString(), sent: false },
    { user_id: DEMO_USER_ID, contact_name: 'James & Linda Park', reminder_type: 'Follow-up', subject: 'Check in on relocation timeline', content: "They mentioned August deadline. Check if they've started mortgage pre-approval.", remind_at: d3.toISOString(), sent: false },
  ])

  return NextResponse.json({ reset: true })
}
