alter table words
add column ending3 text generated always as (right(lemma,3)) stored,
add column ending4 text generated always as (right(lemma,4)) stored;