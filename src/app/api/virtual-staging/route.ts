import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { imageUrl, roomType, designStyle, userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: user, error: authError } = await supabase.auth.admin.getUserById(userId)
    if (authError || !user?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch profile credits
    const { data: profile } = await supabase
      .from('profiles')
      .select('staging_credits, staging_credits_reset_at')
      .eq('id', userId)
      .single()

    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    let currentCredits = profile?.staging_credits ?? 0

    // Reset credits if staging_credits_reset_at is from a previous month
    if (profile?.staging_credits_reset_at) {
      const resetAt = new Date(profile.staging_credits_reset_at)
      const isPreviousMonth =
        resetAt.getFullYear() < today.getFullYear() ||
        (resetAt.getFullYear() === today.getFullYear() && resetAt.getMonth() < today.getMonth())
      if (isPreviousMonth) {
        currentCredits = 3
        await supabase
          .from('profiles')
          .update({ staging_credits: 3, staging_credits_reset_at: todayStr })
          .eq('id', userId)
      }
    }

    if (currentCredits <= 0) {
      return NextResponse.json({ error: 'NO_CREDITS' }, { status: 403 })
    }

    console.log('DECOR8_API_KEY present:', !!process.env.DECOR8_API_KEY)

    const response = await fetch('https://api.decor8.ai/generate_designs_for_room', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DECOR8_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input_image_url: imageUrl,
        room_type: roomType,
        design_style: designStyle,
        num_images: 2
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      return NextResponse.json({ error: `Decor8 AI error: ${errText}` }, { status: 500 })
    }

    const result = await response.json()
    const images = result?.info?.images?.map((img: any) => img.url).filter(Boolean)

    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No images returned from Decor8 AI' }, { status: 500 })
    }

    // Decrement credits
    const newCredits = currentCredits - 1
    await supabase
      .from('profiles')
      .update({
        staging_credits: newCredits,
        staging_credits_reset_at: profile?.staging_credits_reset_at || todayStr,
      })
      .eq('id', userId)

    await supabase.from('virtual_stagings').insert({
      user_id: userId,
      original_image_url: imageUrl,
      staged_image_urls: images,
      room_type: roomType,
      design_style: designStyle,
    })

    return NextResponse.json({ images, creditsRemaining: newCredits })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
