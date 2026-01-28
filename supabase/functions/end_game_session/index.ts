import { serve } from "https://deno.land/std/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  // 1️⃣ Enforce POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    )
  }

  // 2️⃣ Parse JSON body
  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  // 3️⃣ Extract and validate session_id
  const session_id =
  typeof body?.session_id === "string"
    ? body.session_id.trim()
    : null

  if (!session_id) {
    return new Response(
      JSON.stringify({ error: "Missing session_id" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    )
  }

  // 4️⃣ Read env vars INSIDE handler (safe)
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

  // 5️⃣ Create Supabase client
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
  
  const user_id = user.id


  
  const supabaseUser = createClient(supabaseUrl, anonKey, { 
    global: { 
      headers: { Authorization: bearer } 
    } 
  })



  // 6️⃣ Call RPC
  const { data: endGameSessionData, error: endGameSessionError } = await supabase.rpc(
    "end_game_session_tx",
    {
      p_session_id: session_id,
      p_user_id: user_id
    }
  )

  if (endGameSessionError) {
    console.error("End game session RPC error:", endGameSessionError)
    return new Response(
      JSON.stringify({
        error: "RPC failed for end game session",
        details: endGameSessionError.message
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!endGameSessionData || endGameSessionData.length === 0) {
    console.error("RPC returned no data")
    return new Response(
      JSON.stringify({ error: "RPC returned no data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const { data: scorePublicationData, error: scorePublicationError } = await supabaseUser.rpc("sync_score_publication_for_session", {
    p_session_id: session_id
  })

  if (scorePublicationError) {
    console.error("Score publication RPC error:", scorePublicationError)
    return new Response(
      JSON.stringify({
        error: "RPC failed for score publication",
        details: scorePublicationError.message,
        score_publication_failed: true
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  if (!scorePublicationData || scorePublicationData.length === 0) {
    console.error("RPC returned no data")
    return new Response(
      JSON.stringify({ error: "RPC returned no data" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }

  const response = {
    "session": endGameSessionData[0],
    "score_publication": scorePublicationData[0]
  }


  // 7️⃣ Success
  return new Response(
    JSON.stringify(response),
    { headers: { "Content-Type": "application/json" } }
  )
})
