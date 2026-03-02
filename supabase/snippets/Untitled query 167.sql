insert into public.ending_stats (
  ending_len, ending, total,
  masculine, feminine, neuter,
  dominant_share, predictability_class
)
select
  4,
  ending4,
  count(*) as total,
  count(*) filter (where gender = 'masculine') as masculine,
  count(*) filter (where gender = 'feminine') as feminine,
  count(*) filter (where gender = 'neuter') as neuter,
  (
    greatest(
      count(*) filter (where gender = 'masculine'),
      count(*) filter (where gender = 'feminine'),
      count(*) filter (where gender = 'neuter')
    )::numeric / count(*)::numeric
  ) as dominant_share,
  case
    when (
      greatest(
        count(*) filter (where gender = 'masculine'),
        count(*) filter (where gender = 'feminine'),
        count(*) filter (where gender = 'neuter')
      )::numeric / count(*)::numeric
    ) >= 0.90 then 'very_high'
    when (
      greatest(
        count(*) filter (where gender = 'masculine'),
        count(*) filter (where gender = 'feminine'),
        count(*) filter (where gender = 'neuter')
      )::numeric / count(*)::numeric
    ) >= 0.75 then 'high'
    when (
      greatest(
        count(*) filter (where gender = 'masculine'),
        count(*) filter (where gender = 'feminine'),
        count(*) filter (where gender = 'neuter')
      )::numeric / count(*)::numeric
    ) >= 0.60 then 'medium'
    else 'low'
  end
from public.words
group by ending4;