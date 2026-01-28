-- Exercise 1A
ALTER TABLE public.scores
ADD COLUMN difficulty text;





UPDATE public.scores s 
SET difficulty =  gs.difficulty 
FROM public.game_sessions gs 
WHERE s.session_id = gs.id 
AND s.difficulty IS NULL;





ALTER TABLE public.scores
ADD CONSTRAINT scores_difficulty_check CHECK (difficulty in ('very_easy','easy','medium','hard'));

ALTER TABLE public.scores

ALTER COLUMN difficulty SET NOT NULL;






-- Exercise 1B
ALTER TABLE public.scores
ADD CONSTRAINT scores_session_id_unique UNIQUE (session_id);







-- Exercise 1C
CREATE INDEX top_scores_by_difficulty
ON public.scores (difficulty, score DESC, created_at DESC);

CREATE INDEX daily_cap_checks
ON public.scores (user_id, difficulty, created_at);