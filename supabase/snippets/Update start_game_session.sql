drop function if exists public.start_game_session(text, text);

create or replace function start_game_session(
  p_game_type text, 
  p_difficulty text
)
returns table (
  session_id uuid,
  starting_lives_remaining integer,
  word_count integer,
  first_word_id uuid,
  first_lemma text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_session_id uuid;
  v_word_id uuid;
  v_lemma text;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  if p_difficulty not in ('very_easy', 'easy', 'medium', 'hard') then
    raise exception 'Chosen difficulty doesn''t exist';
  end if;  

  insert into public.game_sessions 
    (user_id, game_type, difficulty, lives_remaining, final_score, current_index, word_count)
  values 
    (v_user_id, p_game_type, p_difficulty, 5, 0, 1, 1000)
  returning id into v_session_id;

  select
    sr.word_id,
    sr.lemma
  into
    v_word_id,
    v_lemma
  from public.select_random_word_for_difficulty(p_difficulty) sr;

  insert into public.session_words 
    (session_id, word_id, order_index)
  values 
    (v_session_id, v_word_id, 1);

  return query select v_session_id, 5, 1000, v_word_id, v_lemma;  

  return;
end;
$$;