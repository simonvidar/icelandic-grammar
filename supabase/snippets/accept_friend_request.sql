create or replace function public.accept_friend_request(
  p_from_user_id uuid
)
returns table (
  accepted_user_id uuid,
  accepted_friend_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
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