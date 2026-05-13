drop function if exists public.sync_score_publication_for_session(uuid);

create or replace function public.sync_score_publication_for_session(
  p_session_id uuid
)
returns table (
  score_session_id uuid,
  visibility text,
  anonymous boolean,
  score integer,
  difficulty text,
  created_at timestamptz,
  was_published boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
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
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  select
    gs.final_score,
    gs.difficulty,
    gs.ended_at
  into 
    v_score,
    v_difficulty,
    v_ended_at
  from public.game_sessions gs
  where gs.id = p_session_id
    and gs.user_id = v_user_id
    and gs.ended_at is not null
  for update;

  if not found then
    raise exception 'Session not found, not owned, or not ended';
  end if;
  
  select 
    up.default_score_visibility,
    up.default_score_anonymous
  into 
    v_default_visibility,
    v_default_anonymous
  from public.user_preferences up
  where up.user_id = v_user_id;

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
    v_day_start := date_trunc('day', v_ended_at at time zone 'UTC') at time zone 'UTC';
    v_day_end := v_day_start + interval '1 day';

    select
      count(*)
    into
      v_published_count
    from public.scores s
    where s.user_id = v_user_id
      and s.difficulty = v_difficulty
      and s.visibility in ('friends', 'global')
      and s.session_id != p_session_id
      and s.created_at >= v_day_start
      and s.created_at < v_day_end;

    if v_published_count >= 10 then
      v_final_visibility := 'private';
      v_was_published := false;
    end if;
  end if;

  insert into public.scores (
    session_id,
    user_id,
    score,
    difficulty,
    visibility,
    anonymous,
    created_at
  )
  values (
    p_session_id,
    v_user_id,
    v_score,
    v_difficulty,
    v_final_visibility,
    v_default_anonymous,
    v_ended_at
  )
  on conflict (session_id)
  do update set
    score = excluded.score,
    difficulty = excluded.difficulty,
    visibility = excluded.visibility,
    anonymous = excluded.anonymous;
  
  return query
  select
    s.session_id as score_session_id,
    s.visibility,
    s.anonymous,
    s.score,
    s.difficulty,
    s.created_at,
    v_was_published
  from public.scores s
  where s.session_id = p_session_id
    and s.user_id = v_user_id;

  return; 
end; 
$$;