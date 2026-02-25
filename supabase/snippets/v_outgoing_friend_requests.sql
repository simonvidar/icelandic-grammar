create or replace view public.v_outgoing_friend_requests as
select
  friendships.id as friendship_id, friendships.friend_id as to_user_id, profiles.display_name as display_name,  profiles.avatar_url as avatar_url, friendships.created_at as requested_at
from
  friendships
inner join
  profiles on friendships.friend_id = profiles.id
where
  friendships.status = 'pending' and friendships.user_id = auth.uid();