


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";



COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."accept_friend_request"("p_from_user_id" "uuid") RETURNS TABLE("accepted_user_id" "uuid", "accepted_friend_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  if p_from_user_id = v_user_id then
    raise exception 'Cannot accept your own request';
  end if;

  perform 1
  from friendships
  where user_id = p_from_user_id
    and friend_id = v_user_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'No pending friend request found';
  end if;

  update friendships
  set
    status = 'accepted'
  where
    user_id = p_from_user_id
    and friend_id = v_user_id
    and status = 'pending';
  if not found then
    raise exception 'Pending request disappeared';
  end if;

  perform 1 
  from friendships
  where user_id = v_user_id
    and friend_id = p_from_user_id;
  if found then
    raise exception 'Reverse friendship row already exists';
  end if;

  insert into friendships (user_id, friend_id, status)
  values (v_user_id, p_from_user_id, 'accepted');

  return query select v_user_id, p_from_user_id;

  return;
end;
$$;


CREATE OR REPLACE FUNCTION "public"."apply_score_preferences_all_time"() RETURNS TABLE("total_processed" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


CREATE OR REPLACE FUNCTION "public"."end_game_session_tx"("p_session_id" "uuid", "p_user_id" "uuid") RETURNS TABLE("session_id" "uuid", "ended_at" timestamp with time zone, "final_score" integer, "lives_remaining" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  v_correct integer;
  v_incorrect integer;
  v_final_score integer;
  v_lives_remaining integer;
  v_max_lives constant integer := 5;
begin
  -- 1´©ÅÔâú Lock session row
  select
    gs.ended_at
  into
    ended_at
  from public.game_sessions gs
  where gs.id = p_session_id
    and gs.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Session not found or not owned';
  end if;

  -- 2´©ÅÔâú Idempotency
  if ended_at is not null then
    session_id := p_session_id;

    select
      gs.final_score,
      gs.lives_remaining
    into
      final_score,
      lives_remaining
    from public.game_sessions gs
    where gs.id = p_session_id;

    return next;
  end if;

  -- 3´©ÅÔâú Derive facts from session_words
  select
    count(*) filter (where was_correct),
    count(*) filter (where not was_correct)
  into
    v_correct,
    v_incorrect
  from public.session_words sw
  where sw.session_id = p_session_id;

  -- 4´©ÅÔâú Compute derived values (LOCAL variables)
  v_final_score := coalesce(v_correct, 0);
  v_lives_remaining := greatest(
    v_max_lives - coalesce(v_incorrect, 0),
    0
  );

  -- 5´©ÅÔâú Persist results
  update public.game_sessions
  set
    ended_at = now(),
    final_score = v_final_score,
    lives_remaining = v_lives_remaining
  where id = p_session_id;

  -- 6´©ÅÔâú Return output values
  session_id := p_session_id;
  ended_at := now();
  final_score := v_final_score;
  lives_remaining := v_lives_remaining;

  return next;
end;
$$;



CREATE OR REPLACE FUNCTION "public"."get_word_predictability"("p_lemma" "text") RETURNS TABLE("selected_ending_len" integer, "matched_ending" "text", "predictability_class" "text", "dominant_share" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_ending4 text;
  v_ending3 text;
  v_predictability_class text;
  v_dominant_share numeric;
begin
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



CREATE OR REPLACE FUNCTION "public"."remove_friend"("p_other_user_id" "uuid") RETURNS TABLE("deleted_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid;
  v_deleted_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  if p_other_user_id = v_user_id then
    raise exception 'Cannot remove yourself';
  end if;

  delete from friendships
  where (user_id = v_user_id and friend_id = p_other_user_id)
  or (user_id = p_other_user_id and friend_id = v_user_id);
  get diagnostics v_deleted_count = row_count;

  return query select v_deleted_count;
  return;
end;
$$;


CREATE OR REPLACE FUNCTION "public"."select_random_word_for_difficulty"("p_difficulty" "text") RETURNS TABLE("word_id" "uuid", "lemma" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
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


CREATE OR REPLACE FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") RETURNS TABLE("id" "uuid", "user_id" "uuid", "friend_id" "uuid", "status" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid;

begin

  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  if p_friend_id = v_user_id then
    raise exception 'Cannot friend yourself';
  end if;

  perform 1
  from friendships
  where 
    (user_id = v_user_id and friend_id = p_friend_id) or
    (user_id = p_friend_id and friend_id = v_user_id);

  if found then
    raise exception 'Friend request already exists';
  end if;

  return query
  insert into public.friendships (user_id, friend_id, status)
  values (v_user_id, p_friend_id, 'pending')
  returning id, user_id, friend_id, status, created_at;
  
  return;
end;
$$;


CREATE OR REPLACE FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text") RETURNS TABLE("session_id" "uuid", "lives_remaining" integer, "word_count" integer, "first_word_id" "uuid", "first_lemma" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
    raise exception 'Chosen difficulty doesnt''t exist';
  end if;  

  insert into public.game_sessions 
    (user_id, game_type, difficulty, lives_remaining, final_score, current_index, word_count)
  values 
    (v_user_id, p_game_type, p_difficulty, 5, 0, 1, 1000)
  returning id into v_session_id;


  select
    word_id, lemma
  into
    v_word_id, v_lemma
  from public.select_random_word_for_difficulty(p_difficulty);

  insert into public.session_words 
    (session_id, word_id, order_index)
  values 
    (v_session_id, v_word_id, 1);
  return query select v_session_id, 5, 1000, v_word_id, v_lemma;  

  return;
end;
$$;


CREATE OR REPLACE FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text", "p_word_count" integer DEFAULT 1000) RETURNS TABLE("session_id" "uuid", "lives_remaining" integer, "word_count" integer, "first_word_id" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  insert into public.game_sessions (user_id, difficulty, lives_remaining, final_score)
  values (v_user_id, p_difficulty, 5, 0);


  return;
end;
$$;


CREATE OR REPLACE FUNCTION "public"."submit_guess"("p_session_id" "uuid", "p_answered_gender" "text") RETURNS TABLE("was_correct" boolean, "lives_remaining" integer, "current_score" integer, "is_game_over" boolean, "next_word_id" "uuid", "next_lemma" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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
    current_index, lives_remaining, final_score, word_count, difficulty
  into
    v_current_index, v_lives_remaining, v_final_score, v_word_count, v_difficulty
  from public.game_sessions
  where
    id = p_session_id and
    user_id = v_user_id and
    ended_at is null
  for update;
  
  if not found then
    raise exception 'Active game session couldn''t be found';
  end if;

  select
    id, word_id, was_correct
  into
    v_session_word_id, v_word_id, v_was_correct
  from public.session_words
  where 
    session_id = p_session_id and
    order_index = v_current_index
  for update;

  if not found then
    raise exception 'Game session word couldn''t be found';
  end if;

  if v_was_correct is not null then
    raise exception 'Word is already guessed';
  end if;

  select
    gender
  into
    v_correct_gender
  from public.words
  where id = v_word_id;

  if not found then
    raise exception 'Word not found';
  end if;

  if p_answered_gender not in ('masculine','feminine','neuter') then
    raise exception 'Gender is corrupt';
  end if;

  v_is_correct := (p_answered_gender = v_correct_gender);

  update public.session_words
  set was_correct = v_is_correct, answered_gender = p_answered_gender, answered_at = now()
  where id = v_session_word_id;

  if v_is_correct then
    v_final_score := v_final_score + 1;
  else
    v_lives_remaining := v_lives_remaining - 1;
  end if;

  v_current_index := v_current_index + 1;

  v_is_game_over := v_lives_remaining <= 0 or v_current_index > v_word_count;

  update public.game_sessions
  set ended_at = case 
                  when v_is_game_over then now() 
                  else ended_at 
                end,
  current_index = v_current_index, lives_remaining = v_lives_remaining, final_score = v_final_score
  where id = p_session_id;

  if v_is_game_over then
    v_next_word_id := null;
    v_next_lemma := null;
  else
    select
      word_id
    into
      v_next_word_id
    from public.session_words
    where
      session_id = p_session_id and
      order_index = v_current_index;

    if v_next_word_id is null then
      select
        word_id, lemma
      into
        v_next_word_id, v_next_lemma
      from public.select_random_word_for_difficulty(v_difficulty);

      insert into public.session_words 
        (session_id, word_id, order_index)
      values 
        (p_session_id, v_next_word_id, v_current_index);
    else
      select
        lemma
      into
        v_next_lemma
      from public.words
      where
        id = v_next_word_id;
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


CREATE OR REPLACE FUNCTION "public"."sync_score_publication_for_session"("p_session_id" "uuid") RETURNS TABLE("session_id" "uuid", "visibility" "text", "anonymous" boolean, "score" integer, "difficulty" "text", "created_at" timestamp with time zone, "was_published" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_user_id uuid;
  v_default_visibility text;
  v_default_anonymous boolean;
  v_score integer;
  v_difficulty text;
  v_ended_at timestamptz;
  v_final_visibility text;
  v_was_published boolean;
  v_published_count integer;
  v_day_start timestamptz;
  v_day_end timestamptz;
BEGIN
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  select
    final_score, difficulty, ended_at
  into 
    v_score, v_difficulty, v_ended_at
  from public.game_sessions
  where id = p_session_id
    and user_id = v_user_id
    and ended_at IS NOT null
  for update;

  if not found then
    raise exception 'Session not found, not owned, or not ended';
  end if;
  
  select 
    default_score_visibility, default_score_anonymous
  into 
    v_default_visibility, v_default_anonymous
  from public.user_preferences
  where 
    user_id = v_user_id;

  if not found then
    v_default_visibility := 'private';
    v_default_anonymous := false;
  end if;

  v_final_visibility := v_default_visibility;
  v_was_published := false;

  if v_final_visibility in ('friends', 'global') then
    v_was_published := true;
  end if;

  if v_was_published = true then
    v_day_start := date_trunc('day', v_ended_at AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
    v_day_end := v_day_start + INTERVAL '1 day';

    select
      count(*)
    into
      v_published_count
    from public.scores
    where user_id = v_user_id
      and difficulty = v_difficulty
      and visibility in ('friends', 'global')
      and session_id != p_session_id
      and created_at >= v_day_start and created_at < v_day_end;

    if v_published_count >= 10 then
      v_final_visibility := 'private';
      v_was_published := false;
    end if;
  end if;

  insert into public.scores (session_id, user_id, score, difficulty, visibility, anonymous, created_at)
  values (p_session_id, v_user_id, v_score, v_difficulty, v_final_visibility, v_default_anonymous, v_ended_at)
  on conflict (session_id)
  do update set
    score = EXCLUDED.score,
    difficulty = EXCLUDED.difficulty,
    visibility = EXCLUDED.visibility,
    anonymous = EXCLUDED.anonymous;
  
  return query select
    session_id, visibility, anonymous, score, difficulty, created_at, v_was_published
  from public.scores
  where session_id = p_session_id
    and user_id = v_user_id;

  RETURN; 
END; 
$$;


CREATE OR REPLACE FUNCTION "public"."update_profile"("p_display_name" "text" DEFAULT NULL::"text", "p_avatar_url" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "display_name" "text", "avatar_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'User must be logged in';
  end if;

  begin
    return query update profiles
    set display_name = coalesce(p_display_name, display_name), avatar_url = coalesce(p_avatar_url, avatar_url)
    where id = v_user_id
    returning id, display_name, avatar_url;
  exception
    when unique_violation then
      raise exception 'Display name already taken';
  end;

  if not found then
    raise exception 'Profile not found';
  end if;

  return;
end;
$$;

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "game_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "image_url" "text"
);


CREATE TABLE IF NOT EXISTS "public"."ending_stats" (
    "ending_len" integer NOT NULL,
    "ending" "text" NOT NULL,
    "total" integer NOT NULL,
    "masculine" integer NOT NULL,
    "feminine" integer NOT NULL,
    "neuter" integer NOT NULL,
    "dominant_share" numeric NOT NULL,
    "predictability_class" "text" NOT NULL,
    CONSTRAINT "ending_stats_dominant_share_check" CHECK ((("dominant_share" >= (0)::numeric) AND ("dominant_share" <= (1)::numeric))),
    CONSTRAINT "ending_stats_ending_len_check" CHECK (("ending_len" = ANY (ARRAY[3, 4]))),
    CONSTRAINT "ending_stats_predictability_class_check" CHECK (("predictability_class" = ANY (ARRAY['very_high'::"text", 'high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "total_matches_gender_sum" CHECK (("total" = (("masculine" + "feminine") + "neuter")))
);


CREATE TABLE IF NOT EXISTS "public"."friendships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "friend_id" "uuid" NOT NULL,
    "status" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friendships_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text"])))
);


CREATE TABLE IF NOT EXISTS "public"."game_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "game_type" "text" NOT NULL,
    "difficulty" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ended_at" timestamp with time zone,
    "final_score" integer DEFAULT 0,
    "lives_remaining" integer DEFAULT 5,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_index" integer DEFAULT 1 NOT NULL,
    "word_count" integer DEFAULT 1000 NOT NULL,
    CONSTRAINT "game_sessions_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['very_easy'::"text", 'easy'::"text", 'medium'::"text", 'hard'::"text"]))),
    CONSTRAINT "game_sessions_lives_remaining_check" CHECK ((("lives_remaining" >= 0) AND ("lives_remaining" <= 5)))
);


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "avatar_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


CREATE TABLE IF NOT EXISTS "public"."scores" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "score" integer NOT NULL,
    "visibility" "text" NOT NULL,
    "anonymous" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "difficulty" "text" NOT NULL,
    CONSTRAINT "scores_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['very_easy'::"text", 'easy'::"text", 'medium'::"text", 'hard'::"text"]))),
    CONSTRAINT "scores_visibility_check" CHECK (("visibility" = ANY (ARRAY['private'::"text", 'friends'::"text", 'global'::"text"])))
);


CREATE TABLE IF NOT EXISTS "public"."session_words" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "word_id" "uuid" NOT NULL,
    "order_index" integer NOT NULL,
    "was_correct" boolean,
    "answered_at" timestamp with time zone,
    "answered_gender" "text",
    CONSTRAINT "session_words_answered_gender_check" CHECK (("answered_gender" = ANY (ARRAY['masculine'::"text", 'feminine'::"text", 'neuter'::"text"])))
);


CREATE TABLE IF NOT EXISTS "public"."user_achievements" (
    "user_id" "uuid" NOT NULL,
    "achievement_id" "uuid" NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "default_score_visibility" "text" NOT NULL,
    "default_score_anonymous" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "show_achievements_to_friends" boolean DEFAULT false NOT NULL,
    CONSTRAINT "user_preferences_default_score_visibility_check" CHECK (("default_score_visibility" = ANY (ARRAY['private'::"text", 'friends'::"text", 'global'::"text"])))
);


CREATE OR REPLACE VIEW "public"."v_friends" AS
 SELECT "friendships"."id" AS "friendship_id",
    "friendships"."friend_id" AS "friend_user_id",
    "profiles"."display_name",
    "profiles"."avatar_url",
    "friendships"."created_at" AS "friends_since"
   FROM ("public"."friendships"
     JOIN "public"."profiles" ON (("friendships"."friend_id" = "profiles"."id")))
  WHERE (("friendships"."status" = 'accepted'::"text") AND ("friendships"."user_id" = "auth"."uid"()));


CREATE OR REPLACE VIEW "public"."v_incoming_friend_requests" AS
 SELECT "friendships"."id" AS "friendship_id",
    "friendships"."user_id" AS "from_user_id",
    "profiles"."display_name",
    "profiles"."avatar_url",
    "friendships"."created_at" AS "requested_at"
   FROM ("public"."friendships"
     JOIN "public"."profiles" ON (("friendships"."user_id" = "profiles"."id")))
  WHERE (("friendships"."status" = 'pending'::"text") AND ("friendships"."friend_id" = "auth"."uid"()));


CREATE OR REPLACE VIEW "public"."v_outgoing_friend_requests" AS
 SELECT "friendships"."id" AS "friendship_id",
    "friendships"."friend_id" AS "to_user_id",
    "profiles"."display_name",
    "profiles"."avatar_url",
    "friendships"."created_at" AS "requested_at"
   FROM ("public"."friendships"
     JOIN "public"."profiles" ON (("friendships"."friend_id" = "profiles"."id")))
  WHERE (("friendships"."status" = 'pending'::"text") AND ("friendships"."user_id" = "auth"."uid"()));


CREATE TABLE IF NOT EXISTS "public"."words" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lemma" "text" NOT NULL,
    "gender" "text" NOT NULL,
    "frequency_rank" integer,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "ending3" "text" GENERATED ALWAYS AS ("right"("lemma", 3)) STORED,
    "ending4" "text" GENERATED ALWAYS AS ("right"("lemma", 4)) STORED,
    CONSTRAINT "words_gender_check" CHECK (("gender" = ANY (ARRAY['masculine'::"text", 'feminine'::"text", 'neuter'::"text"])))
);


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ending_stats"
    ADD CONSTRAINT "ending_len_ending_unique" UNIQUE ("ending_len", "ending");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_id_friend_id_key" UNIQUE ("user_id", "friend_id");



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_session_id_unique" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."session_words"
    ADD CONSTRAINT "session_words_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("user_id", "achievement_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."words"
    ADD CONSTRAINT "words_pkey" PRIMARY KEY ("id");



CREATE INDEX "daily_cap_checks" ON "public"."scores" USING "btree" ("user_id", "difficulty", "created_at");



CREATE UNIQUE INDEX "profiles_display_name_unique" ON "public"."profiles" USING "btree" ("lower"("display_name"));



CREATE UNIQUE INDEX "session_words_session_order_uq" ON "public"."session_words" USING "btree" ("session_id", "order_index");



CREATE UNIQUE INDEX "session_words_session_word_uq" ON "public"."session_words" USING "btree" ("session_id", "word_id");



CREATE INDEX "top_scores_by_difficulty" ON "public"."scores" USING "btree" ("difficulty", "score" DESC, "created_at" DESC);



CREATE INDEX "words_ending3_freq_rank" ON "public"."words" USING "btree" ("ending3", "frequency_rank");



CREATE INDEX "words_ending4_freq_rank" ON "public"."words" USING "btree" ("ending4", "frequency_rank");



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friendships"
    ADD CONSTRAINT "friendships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."game_sessions"
    ADD CONSTRAINT "game_sessions_user_id_fkey1" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scores"
    ADD CONSTRAINT "scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_words"
    ADD CONSTRAINT "session_words_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."game_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_words"
    ADD CONSTRAINT "session_words_word_id_fkey" FOREIGN KEY ("word_id") REFERENCES "public"."words"("id");



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_achievements"
    ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Achievments are publicly available" ON "public"."achievements" FOR SELECT USING (true);



CREATE POLICY "Anyone can read global scores" ON "public"."scores" FOR SELECT USING (("visibility" = 'global'::"text"));



CREATE POLICY "Friends can read friends-only scores" ON "public"."scores" FOR SELECT USING ((("visibility" = 'friends'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."friendships" "f"
  WHERE (("f"."friend_id" = "scores"."user_id") AND ("f"."user_id" = "auth"."uid"()) AND ("f"."status" = 'accepted'::"text"))))));



CREATE POLICY "Friends can see achievments if allowed" ON "public"."user_achievements" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."friendships"
  WHERE (("friendships"."friend_id" = "auth"."uid"()) AND ("friendships"."user_id" = "user_achievements"."user_id") AND ("friendships"."status" = 'accepted'::"text")))) AND (EXISTS ( SELECT 1
   FROM "public"."user_preferences"
  WHERE (("user_preferences"."user_id" = "user_achievements"."user_id") AND ("user_preferences"."show_achievements_to_friends" = true))))));



CREATE POLICY "Friendships are readable for users involved" ON "public"."friendships" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("friend_id" = "auth"."uid"())));



CREATE POLICY "Insert words into active own sessions" ON "public"."session_words" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."game_sessions" "s"
  WHERE (("s"."id" = "session_words"."session_id") AND ("s"."user_id" = "auth"."uid"()) AND ("s"."ended_at" IS NULL)))));



CREATE POLICY "Owner can insert game session" ON "public"."game_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner can read game sessions" ON "public"."game_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Owner can read own scores" ON "public"."scores" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Public profiles are readable" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Read words from own sessions" ON "public"."session_words" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."game_sessions" "s"
  WHERE (("s"."id" = "session_words"."session_id") AND ("s"."user_id" = "auth"."uid"())))));



CREATE POLICY "User can delete own score" ON "public"."scores" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "User can publish own score" ON "public"."scores" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "User can read its own preferences" ON "public"."user_preferences" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "User can update own score" ON "public"."scores" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can create own friend requests" ON "public"."friendships" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can create own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Users can see their own achievements" ON "public"."user_achievements" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own preferences" ON "public"."user_preferences" FOR UPDATE USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own preferences (NOTE: Needs RPC)" ON "public"."friendships" FOR UPDATE USING (("friend_id" = "auth"."uid"())) WITH CHECK (("friend_id" = "auth"."uid"()));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "Words are publicly readable" ON "public"."words" FOR SELECT USING (true);



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."friendships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."game_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scores" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_words" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."words" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_friend_request"("p_from_user_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."accept_friend_request"("p_from_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_friend_request"("p_from_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_friend_request"("p_from_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_score_preferences_all_time"() TO "postgres";
GRANT ALL ON FUNCTION "public"."apply_score_preferences_all_time"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_score_preferences_all_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_score_preferences_all_time"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."end_game_session_tx"("p_session_id" "uuid", "p_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."end_game_session_tx"("p_session_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."end_game_session_tx"("p_session_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."end_game_session_tx"("p_session_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_word_predictability"("p_lemma" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."get_word_predictability"("p_lemma" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_word_predictability"("p_lemma" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_word_predictability"("p_lemma" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_friend"("p_other_user_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."remove_friend"("p_other_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_friend"("p_other_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_friend"("p_other_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."select_random_word_for_difficulty"("p_difficulty" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."select_random_word_for_difficulty"("p_difficulty" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."select_random_word_for_difficulty"("p_difficulty" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."select_random_word_for_difficulty"("p_difficulty" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_friend_request"("p_friend_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text", "p_word_count" integer) TO "postgres";
GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text", "p_word_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text", "p_word_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_game_session"("p_game_type" "text", "p_difficulty" "text", "p_word_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."submit_guess"("p_session_id" "uuid", "p_answered_gender" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."submit_guess"("p_session_id" "uuid", "p_answered_gender" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."submit_guess"("p_session_id" "uuid", "p_answered_gender" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."submit_guess"("p_session_id" "uuid", "p_answered_gender" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_score_publication_for_session"("p_session_id" "uuid") TO "postgres";
GRANT ALL ON FUNCTION "public"."sync_score_publication_for_session"("p_session_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."sync_score_publication_for_session"("p_session_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_score_publication_for_session"("p_session_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_profile"("p_display_name" "text", "p_avatar_url" "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."update_profile"("p_display_name" "text", "p_avatar_url" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_profile"("p_display_name" "text", "p_avatar_url" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_profile"("p_display_name" "text", "p_avatar_url" "text") TO "service_role";



GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."ending_stats" TO "postgres";
GRANT ALL ON TABLE "public"."ending_stats" TO "anon";
GRANT ALL ON TABLE "public"."ending_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."ending_stats" TO "service_role";



GRANT ALL ON TABLE "public"."friendships" TO "anon";
GRANT ALL ON TABLE "public"."friendships" TO "authenticated";
GRANT ALL ON TABLE "public"."friendships" TO "service_role";



GRANT ALL ON TABLE "public"."game_sessions" TO "anon";
GRANT ALL ON TABLE "public"."game_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."game_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."scores" TO "anon";
GRANT ALL ON TABLE "public"."scores" TO "authenticated";
GRANT ALL ON TABLE "public"."scores" TO "service_role";



GRANT ALL ON TABLE "public"."session_words" TO "anon";
GRANT ALL ON TABLE "public"."session_words" TO "authenticated";
GRANT ALL ON TABLE "public"."session_words" TO "service_role";



GRANT ALL ON TABLE "public"."user_achievements" TO "anon";
GRANT ALL ON TABLE "public"."user_achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."user_achievements" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."v_friends" TO "postgres";
GRANT ALL ON TABLE "public"."v_friends" TO "anon";
GRANT ALL ON TABLE "public"."v_friends" TO "authenticated";
GRANT ALL ON TABLE "public"."v_friends" TO "service_role";



GRANT ALL ON TABLE "public"."v_incoming_friend_requests" TO "postgres";
GRANT ALL ON TABLE "public"."v_incoming_friend_requests" TO "anon";
GRANT ALL ON TABLE "public"."v_incoming_friend_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."v_incoming_friend_requests" TO "service_role";



GRANT ALL ON TABLE "public"."v_outgoing_friend_requests" TO "postgres";
GRANT ALL ON TABLE "public"."v_outgoing_friend_requests" TO "anon";
GRANT ALL ON TABLE "public"."v_outgoing_friend_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."v_outgoing_friend_requests" TO "service_role";



GRANT ALL ON TABLE "public"."words" TO "anon";
GRANT ALL ON TABLE "public"."words" TO "authenticated";
GRANT ALL ON TABLE "public"."words" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







