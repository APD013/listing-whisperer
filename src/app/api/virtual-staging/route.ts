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
    const images: string[] = result?.info?.images ?? []

    if (!images.length) {
      return NextResponse.json({ error: 'No images returned from Decor8 AI' }, { status: 500 })
    }

    return NextResponse.json({ images })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
