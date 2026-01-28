create or replace function public.apply_score_preferences_all_time()
returns table (
  total_processed integer
)
language plpgsql
security definer
SET search_path = public
as $$
declare
  v_user_id uuid;
  v_total_processed integer := 0;
  v_session_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  for v_session_id in
    select id
    from game_sessions
    where user_id = v_user_id
      and ended_at is not null
  loop
    perform public.sync_score_publication_for_session(v_session_id);
    v_total_processed := v_total_processed + 1;
  end loop;

  return query select v_total_processed;

  return;
end;
$$;