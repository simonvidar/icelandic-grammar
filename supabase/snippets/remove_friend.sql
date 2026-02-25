create or replace function public.remove_friend(
  p_other_user_id uuid
)
returns table (
  deleted_count integer
)
language plpgsql
security definer
SET search_path = public
as $$
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