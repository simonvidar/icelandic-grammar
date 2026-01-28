import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // Enforce POST
  if(req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed"}),
      { status: 405, headers: { "Content-Type": "application/json" } }
    )
  }


  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")

  if (!supabaseUrl || !serviceKey || !anonKey) {
    console.error("Missing Supabase env vars")
    return new Response(
      JSON.stringify({ error: "Server misconfigured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const authHeader = req.headers.get("Authorization")

  if(!authHeader){
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers: {"Content-Type": "application/json" }}
    )
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
  const bearer = `Bearer ${token}`;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token)

  if(authError || !user){
    return new Response(
      JSON.stringify({ error: "Invalid or expired token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    )
  }

  const supabaseUser = createClient(supabaseUrl, anonKey, { 
    global: { 
      headers: { Authorization: bearer } 
    } 
  })

  const { data, error } = await supabaseUser.rpc("apply_score_preferences_all_time")

  if (error) {
    console.error("RPC error:", error)
    return new Response(
      JSON.stringify({
        error: "RPC failed",
        details: error.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  if(!data || data.length === 0 || typeof data[0].total_processed !== "number") {
    console.error("RPC returned no data")
    return new Response(
      JSON.stringify({ error: "RPC returned no data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  return new Response(
    JSON.stringify({ "total_processed": data[0].total_processed }),
    { headers: { "Content-Type": "application/json" } },
  )
})