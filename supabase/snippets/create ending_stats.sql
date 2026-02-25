create table if not exists ending_stats (
  ending_len int not null check (ending_len in (3,4)),
  ending text not null,
  total int not null,
  masculine int not null,
  feminine int not null,
  neuter int not null,
  dominant_share numeric not null check (dominant_share >= 0 and dominant_share <= 1),
  predictability_class text not null check (predictability_class in ('very_high','high','medium','low')),
  constraint ending_len_ending_unique unique (ending_len, ending),
  constraint total_matches_gender_sum 
    check (total = masculine + feminine + neuter)  
)