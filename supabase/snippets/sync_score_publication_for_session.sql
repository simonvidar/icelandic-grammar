CREATE OR REPLACE FUNCTION public.sync_score_publication_for_session(
  p_session_id uuid
)
RETURNS TABLE (
  session_id uuid,
  visibility text,
  anonymous boolean,
  score integer,
  difficulty text,
  created_at timestamptz,
  was_published boolean
)
language plpgsql
security definer
SET search_path = public
as $$
DECLARE
  v_user_id uuid;
  v_default_visibility text;
  v_default_anonymous boolean;
  v_score integer;
  v_difficulty text;
  v_ended_at timestamptz;
  v_final_visibility text;
  v_was_published boolean;
  v_published_count integer;
  v_day_start timestamptz;
  v_day_end timestamptz;
BEGIN
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  select
    final_score, difficulty, ended_at
  into 
    v_score, v_difficulty, v_ended_at
  from public.game_sessions
  where id = p_session_id
    and user_id = v_user_id
    and ended_at IS NOT null
  for update;

  if not found then
    raise exception 'Session not found, not owned, or not ended';
  end if;
  
  select 
    default_score_visibility, default_score_anonymous
  into 
    v_default_visibility, v_default_anonymous
  from public.user_preferences
  where 
    user_id = v_user_id;

  if not found then
    v_default_visibility := 'private';
    v_default_anonymous := false;
  end if;

  v_final_visibility := v_default_visibility;
  v_was_published := false;

  if v_final_visibility in ('friends', 'global') then
    v_was_published := true;
  end if;

  if v_was_published = true then
    v_day_start := date_trunc('day', v_ended_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
    v_day_end := v_day_start + INTERVAL '1 day';

    select
      count(*)
    into
      v_published_count
    from public.scores
    where user_id = v_user_id
      and difficulty = v_difficulty
      and visibility in ('friends', 'global')
      and session_id != p_session_id
      and created_at >= v_day_start and created_at < v_day_end;

    if v_published_count >= 10 then
      v_final_visibility := 'private';
      v_was_published := false;
    end if;
  end if;

  insert into public.scores (session_id, user_id, score, difficulty, visibility, anonymous, created_at)
  values (p_session_id, v_user_id, v_score, v_difficulty, v_final_visibility, v_default_anonymous, v_ended_at)
  on conflict (session_id)
  do update set
    score = EXCLUDED.score,
    difficulty = EXCLUDED.difficulty,
    visibility = EXCLUDED.visibility,
    anonymous = EXCLUDED.anonymous;
  
  return query select
    session_id, visibility, anonymous, score, difficulty, created_at, v_was_published
  from public.scores
  where session_id = p_session_id
    and user_id = v_user_id;

  RETURN; 
END; 
$$;