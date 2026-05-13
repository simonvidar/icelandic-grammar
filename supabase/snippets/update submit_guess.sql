drop function if exists public.submit_guess(uuid, text);

create or replace function submit_guess(
  p_session_id uuid, 
  p_answered_gender text
) 
returns table (
  was_correct boolean, 
  lives_remaining integer, 
  current_score integer,
  is_game_over boolean,
  next_word_id uuid, 
  next_lemma text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_current_index integer;
  v_lives_remaining integer;
  v_final_score integer;
  v_word_count integer;
  v_word_id uuid;
  v_was_correct boolean;
  v_correct_gender text;
  v_is_correct boolean;
  v_session_word_id uuid;
  v_is_game_over boolean;
  v_difficulty text;
  v_next_word_id uuid;
  v_next_lemma text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  select
    gs.current_index,
    gs.lives_remaining,
    gs.final_score,
    gs.word_count,
    gs.difficulty
  into
    v_current_index,
    v_lives_remaining,
    v_final_score,
    v_word_count,
    v_difficulty
  from public.game_sessions gs
  where
    gs.id = p_session_id
    and gs.user_id = v_user_id
    and gs.ended_at is null
  for update;
  
  if not found then
    raise exception 'Active game session couldn''t be found';
  end if;

  select
    sw.id,
    sw.word_id,
    sw.was_correct
  into
    v_session_word_id,
    v_word_id,
    v_was_correct
  from public.session_words sw
  where 
    sw.session_id = p_session_id
    and sw.order_index = v_current_index
  for update;

  if not found then
    raise exception 'Game session word couldn''t be found';
  end if;

  if v_was_correct is not null then
    raise exception 'Word is already guessed';
  end if;

  select
    w.gender
  into
    v_correct_gender
  from public.words w
  where w.id = v_word_id;

  if not found then
    raise exception 'Word not found';
  end if;

  if p_answered_gender not in ('masculine', 'feminine', 'neuter') then
    raise exception 'Gender is corrupt';
  end if;

  v_is_correct := (p_answered_gender = v_correct_gender);

  update public.session_words sw
  set
    was_correct = v_is_correct,
    answered_gender = p_answered_gender,
    answered_at = now()
  where sw.id = v_session_word_id;

  if v_is_correct then
    v_final_score := v_final_score + 1;
  else
    v_lives_remaining := v_lives_remaining - 1;
  end if;

  v_current_index := v_current_index + 1;

  v_is_game_over := v_lives_remaining <= 0 or v_current_index > v_word_count;

  update public.game_sessions gs
  set
    ended_at = case 
      when v_is_game_over then now() 
      else gs.ended_at 
    end,
    current_index = v_current_index,
    lives_remaining = v_lives_remaining,
    final_score = v_final_score
  where gs.id = p_session_id;

  if v_is_game_over then
    v_next_word_id := null;
    v_next_lemma := null;
  else
    select
      sw.word_id
    into
      v_next_word_id
    from public.session_words sw
    where
      sw.session_id = p_session_id
      and sw.order_index = v_current_index;

    if v_next_word_id is null then
      select
        sr.word_id,
        sr.lemma
      into
        v_next_word_id,
        v_next_lemma
      from public.select_random_word_for_difficulty(v_difficulty) sr;

      insert into public.session_words 
        (session_id, word_id, order_index)
      values 
        (p_session_id, v_next_word_id, v_current_index);
    else
      select
        w.lemma
      into
        v_next_lemma
      from public.words w
      where w.id = v_next_word_id;
    end if;
  end if;

  return query select 
    v_is_correct, 
    v_lives_remaining, 
    v_final_score,
    v_is_game_over,
    v_next_word_id,
    v_next_lemma;

  return;
end;
$$;