import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { full_name, email, password, role, trainer_id } = await req.json()

    if (!full_name || !email || !password || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role },
    })

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const userId = authData.user.id

    // Upsert profile
    await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name,
      role,
      onboarded: false,
    })

    // If client, create clients row and log activity
    if (role === 'client' && trainer_id) {
      await supabase.from('clients').insert({
        trainer_id,
        client_id: userId,
        status: 'active',
      })

      await supabase.from('activity_log').insert({
        trainer_id,
        type: 'new_client',
        description: `New client added: ${full_name}`,
      })
    }

    return new Response(JSON.stringify({ user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
