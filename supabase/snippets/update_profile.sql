create or replace function public.update_profile(
  p_display_name text default null,
  p_avatar_url text default null
)
returns table (
  id uuid,
  display_name text,
  avatar_url text
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