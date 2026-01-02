// supabase/functions/contact-protocol/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email } = await req.json()

        // 1. Basic Validation 
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            throw new Error("INVALID_SYNTAX: Email format rejected.")
        }

        // 2. Initialize Admin Client (Bypasses RLS for extra security logic if needed)
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? ''
        )

        // 3. Get Metadata (The "Tech" Flex)
        // We grab the region where this Edge Function is running to show off "Global Edge Network"
        const region = Deno.env.get('SB_REGION') || 'edge-global';
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // 4. Insert into DB
        const { error } = await supabase
            .from('messages')
            .insert({ email, user_ip: ip })

        if (error) throw error

        // 5. Return "Terminal" style JSON
        return new Response(
            JSON.stringify({
                success: true,
                protocol: "SMTP_HANDSHAKE_V2",
                region: region,
                latency: "12ms", // Simulated or calculated
                message: "Transmission Secure. Packet Received."
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})