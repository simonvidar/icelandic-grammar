create or replace function public.end_game_session_tx(
  p_session_id uuid,
  p_user_id uuid
)
returns table (
  session_id uuid,
  ended_at timestamptz,
  final_score integer,
  lives_remaining integer
)
language plpgsql
security definer
as $$
declare
  v_correct integer;
  v_incorrect integer;
  v_final_score integer;
  v_lives_remaining integer;
  v_max_lives constant integer := 5;
begin
  -- 1️⃣ Lock session row
  select
    gs.ended_at
  into
    ended_at
  from public.game_sessions gs
  where gs.id = p_session_id
    and gs.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Session not found or not owned';
  end if;

  -- 2️⃣ Idempotency
  if ended_at is not null then
    session_id := p_session_id;

    select
      gs.final_score,
      gs.lives_remaining
    into
      final_score,
      lives_remaining
    from public.game_sessions gs
    where gs.id = p_session_id;

    return next;
  end if;

  -- 3️⃣ Derive facts from session_words
  select
    count(*) filter (where was_correct),
    count(*) filter (where not was_correct)
  into
    v_correct,
    v_incorrect
  from public.session_words sw
  where sw.session_id = p_session_id;

  -- 4️⃣ Compute derived values (LOCAL variables)
  v_final_score := coalesce(v_correct, 0);
  v_lives_remaining := greatest(
    v_max_lives - coalesce(v_incorrect, 0),
    0
  );

  -- 5️⃣ Persist results
  update public.game_sessions
  set
    ended_at = now(),
    final_score = v_final_score,
    lives_remaining = v_lives_remaining
  where id = p_session_id;

  -- 6️⃣ Return output values
  session_id := p_session_id;
  ended_at := now();
  final_score := v_final_score;
  lives_remaining := v_lives_remaining;

  return next;
end;
$$;
