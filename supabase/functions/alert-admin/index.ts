import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const handler = async (request: Request): Promise<Response> => {
  // 1. Parse the Webhook Payload (Supabase sends the record automatically)
  const payload = await request.json()
  const { record } = payload // 'record' contains the new row data (email, id, etc.)

  console.log("New Entry Detected:", record.email)

  // 2. Send Email via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Portfolio Bot <contact@axelescutia.com>',
      to: 'axeleszu@gmail.com',
      subject: `🚀 New Lead: ${record.email}`,
      html: `
        <h1>New Contact Protocol Initiated</h1>
        <p><strong>Email:</strong> ${record.email}</p>
        <p><strong>IP:</strong> ${record.user_ip || 'Hidden'}</p>
        <p><strong>Time:</strong> ${record.created_at}</p>
      `,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

serve(handler)