create or replace function public.send_friend_request(
  p_friend_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  friend_id uuid,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
SET search_path = public
as $$
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