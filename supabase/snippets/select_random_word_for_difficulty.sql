create or replace function select_random_word_for_difficulty(
  p_difficulty text
)
returns table (
  word_id uuid,
  lemma text
)
language plpgsql
set search_path = public
as $$
declare
  
begin
  if p_difficulty not in ('very_easy', 'easy', 'medium', 'hard') then
    raise exception 'Chosen difficulty doesnt''t exist';
  end if;

  if p_difficulty = 'very_easy' then
    select
      w.id, w.lemma
    into
      word_id, lemma
    from public.words w
    inner join public.ending_stats e on w.ending4 = e.ending and e.ending_len = 4
    where
      w.frequency_rank is not null and w.frequency_rank <= 1000
      and e.total >= 30 and e.predictability_class = 'very_high'    
    order by random()
    limit 1;

    if not found then
      select
        w.id, w.lemma
      into
        word_id, lemma
      from public.words w
      inner join public.ending_stats e on w.ending3 = e.ending and e.ending_len = 3 
      where
        w.frequency_rank is not null and w.frequency_rank <= 1000
        and e.total >= 15 and e.predictability_class = 'very_high'
      order by random()
      limit 1;

      if not found then
        raise exception 'No words found for difficulty %', p_difficulty;
      end if;
    end if;
    return query select word_id, lemma;
  elsif p_difficulty = 'easy' then
    select
      w.id, w.lemma
    into
      word_id, lemma
    from public.words w
    inner join public.ending_stats e on w.ending4 = e.ending and e.ending_len = 4
    where
      w.frequency_rank is not null and w.frequency_rank <= 3000
      and e.total >= 30 and e.predictability_class in ('very_high','high')    
    order by random()
    limit 1;

    if not found then
      select
        w.id, w.lemma
      into
        word_id, lemma
      from public.words w
      inner join public.ending_stats e on w.ending3 = e.ending and e.ending_len = 3 
      where
        w.frequency_rank is not null and w.frequency_rank <= 3000
        and e.total >= 15 and e.predictability_class in ('very_high','high')
      order by random()
      limit 1;

      if not found then
        raise exception 'No words found for difficulty %', p_difficulty;
      end if;
    end if;
    return query select word_id, lemma;
  elsif p_difficulty = 'medium' then
    select
      w.id, w.lemma
    into
      word_id, lemma
    from public.words w
    inner join public.ending_stats e on w.ending4 = e.ending and e.ending_len = 4
    where
      w.frequency_rank is not null and w.frequency_rank <= 10000
      and e.total >= 30 and e.predictability_class in ('very_high','high','medium')    
    order by random()
    limit 1;

    if not found then
      select
        w.id, w.lemma
      into
        word_id, lemma
      from public.words w
      inner join public.ending_stats e on w.ending3 = e.ending and e.ending_len = 3 
      where
        w.frequency_rank is not null and w.frequency_rank <= 10000
        and e.total >= 15 and e.predictability_class in ('very_high','high','medium')
      order by random()
      limit 1;

      if not found then
        raise exception 'No words found for difficulty %', p_difficulty;
      end if;
    end if;
    return query select word_id, lemma;
  elsif p_difficulty = 'hard' then
    select
      w.id, w.lemma
    into
      word_id, lemma
    from public.words w
    left join public.ending_stats e4 on w.ending4 = e4.ending and e4.ending_len = 4 and e4.total >= 30
    left join public.ending_stats e3 on w.ending3 = e3.ending and e3.ending_len = 3 and e3.total >= 15
    where
      (w.frequency_rank > 10000 or w.frequency_rank is null) or ((e4.ending is not null and e4.predictability_class = 'low') or (e4.ending is null and e3.ending is not null and e3.predictability_class = 'low') or (e4.ending is null and e3.ending is null))
    order by random()
    limit 1;

    if not found then
      raise exception 'No words found for difficulty %', p_difficulty;
    end if;
    return query select word_id, lemma;
  end if;

  return;
end;
$$;