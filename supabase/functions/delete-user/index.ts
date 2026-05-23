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

    const { user_id } = await req.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // Get workout plan IDs for cascade
    const { data: plans } = await supabase.from('workout_plans').select('id').eq('client_id', user_id)
    const planIds = (plans || []).map(p => p.id)

    // Get workout day IDs
    let dayIds: string[] = []
    if (planIds.length > 0) {
      const { data: daysData } = await supabase.from('workout_days').select('id').in('plan_id', planIds)
      dayIds = (daysData || []).map(d => d.id)
    }

    // Delete in order
    if (dayIds.length > 0) {
      await supabase.from('exercises').delete().in('day_id', dayIds)
      await supabase.from('workout_days').delete().in('plan_id', planIds)
    }
    if (planIds.length > 0) {
      await supabase.from('workout_plans').delete().eq('client_id', user_id)
    }

    await supabase.from('intake_forms').delete().eq('client_id', user_id)
    await supabase.from('signed_documents').delete().eq('client_id', user_id)
    await supabase.from('weight_logs').delete().eq('client_id', user_id)
    await supabase.from('performance_logs').delete().eq('client_id', user_id)
    await supabase.from('session_logs').delete().eq('client_id', user_id)

    await supabase.from('messages').delete().or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)

    await supabase.from('clients').delete().or(`trainer_id.eq.${user_id},client_id.eq.${user_id}`)

    // Get and delete videos + storage objects
    const { data: userVideos } = await supabase.from('videos').select('id, file_path').eq('trainer_id', user_id)
    if (userVideos && userVideos.length > 0) {
      const filePaths = userVideos.filter(v => v.file_path).map(v => v.file_path)
      if (filePaths.length > 0) {
        await supabase.storage.from('videos').remove(filePaths)
      }
      await supabase.from('videos').delete().eq('trainer_id', user_id)
    }

    await supabase.from('activity_log').delete().eq('trainer_id', user_id)
    await supabase.from('profiles').delete().eq('id', user_id)

    // Delete auth user last
    await supabase.auth.admin.deleteUser(user_id)

    return new Response(JSON.stringify({ success: true }), {
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
