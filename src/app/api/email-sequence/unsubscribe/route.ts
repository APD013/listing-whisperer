import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return new Response(
      '<html><body style="font-family:sans-serif;text-align:center;padding:60px;">Invalid unsubscribe link.</body></html>',
      { headers: { 'Content-Type': 'text/html' }, status: 400 }
    )
  }

  await supabase
    .from('email_sequences')
    .update({ unsubscribed: true })
    .eq('user_id', userId)

  return new Response(
    `<!DOCTYPE html><html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Unsubscribed</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Plus Jakarta Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:480px;margin:80px auto;padding:0 20px;text-align:center;">
  <p style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px;">
    Listing<span style="color:#1D9E75;">Whisperer</span>
  </p>
  <div style="background:#fff;border-radius:12px;padding:40px;border:1px solid #e8e8e8;margin-top:24px;">
    <p style="font-size:22px;font-weight:700;color:#111;margin:0 0 12px;">You've been unsubscribed</p>
    <p style="font-size:15px;color:#555;line-height:1.7;margin:0 0 24px;">
      You've been unsubscribed from Listing Whisperer emails. You won't receive any more onboarding messages from us.
    </p>
    <a href="https://listingwhisperer.com" style="font-size:14px;color:#1D9E75;text-decoration:none;">
      ← Back to Listing Whisperer
    </a>
  </div>
</div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
