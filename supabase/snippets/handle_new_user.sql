create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      new.raw_user_meta_data ->> 'login',
      new.email,
      'user_' || left(new.id::text, 8)
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