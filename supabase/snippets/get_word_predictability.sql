create or replace function get_word_predictability(
  p_lemma text
)
returns table (
  selected_ending_len integer,
  matched_ending text,
  predictability_class text,
  dominant_share numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ending4 text;
  v_ending3 text;
  v_predictability_class text;
  v_dominant_share numeric;
begin
  if p_lemma is null then
    raise exception 'Invalid lemma';
  end if;

  v_ending4 := right(p_lemma, 4);

  select
    predictability_class, dominant_share
  into
    v_predictability_class, v_dominant_share
  from public.ending_stats 
  where
    ending_len = 4 and ending = v_ending4 and total >= 30;

  if found then
    return query select 4, v_ending4, v_predictability_class, v_dominant_share;
    return;
  end if;

  v_ending3 := right(p_lemma, 3);

  select
    predictability_class, dominant_share
  into
    v_predictability_class, v_dominant_share
  from public.ending_stats 
  where
    ending_len = 3 and ending = v_ending3 and total >= 15;

  if found then
    return query select 3, v_ending3, v_predictability_class, v_dominant_share;
    return;
  end if;

  return query select null, null, 'low', null;
  return;
end;
$$;