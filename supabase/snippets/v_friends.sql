create or replace view public.v_friends as
select
  friendships.id as friendship_id, friendships.friend_id as friend_user_id, profiles.display_name as display_name, profiles.avatar_url as avatar_url, friendships.created_at as friends_since
from
  friendships
inner join
  profiles on friendships.friend_id = profiles.id
where
  friendships.status = 'accepted' and friendships.user_id = auth.uid();