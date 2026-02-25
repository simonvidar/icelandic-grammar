alter table game_sessions 
  add column current_index int not null default 1,
  add column word_count int not null default 1000;

alter table game_sessions
  alter column lives_remaining set default 5,
  alter column final_score set default 0;


alter table session_words
  alter column was_correct drop not null,
  alter column answered_at drop not null,
  alter column answered_at drop default;

alter table session_words
  add column if not exists answered_gender text null 
  check (answered_gender in ('masculine', 'feminine','neuter'));

create unique index if not exists session_words_session_order_uq 
  on public.session_words (session_id, order_index);

create unique index if not exists session_words_session_word_uq 
  on public.session_words (session_id, word_id);

