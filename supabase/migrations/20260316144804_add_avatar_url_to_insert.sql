drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

create function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'login',
      new.email,
      'user_' || left(new.id::text, 8)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  ) on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert
on auth.users
for each row
execute function handle_new_user();