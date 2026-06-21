import { supabase } from '@/src/lib/supabase';
import { theme } from '@/src/theme/theme';
import type { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    fontSize: 24,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  smallTitle: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.bold,
  },
  friendTabs: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.surface,

    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  friendTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.radius.button,
  },
  friendTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendTabActive: {
    backgroundColor: theme.colors.primary,
  },
  friendTabText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.semiBold,
  },
  friendTabTextActive: {
    color: theme.colors.textOnPrimary,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xxl,
    borderRadius: theme.radius.list,
    overflow: 'hidden',

    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyText: {
    padding: theme.spacing.xl,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.regular,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  listSeparator: {
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  avatarColumn: {
    marginHorizontal: theme.spacing.sm,
    width: 28,
  },
  nameColumn: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    color: theme.colors.textPrimary,
  },
  loadingIndicator: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: theme.spacing.xxl,
  },
  errorText: {
    color: theme.colors.danger,
    padding: theme.spacing.xl,
    textAlign: 'center',
    fontFamily: theme.fonts.semiBold,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.bold,
  },
  requestsCount: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xs,
  },
  requestsCountText: {
    color: theme.colors.textOnPrimary,
    fontFamily: theme.fonts.bold,
  },
  requestsCountActive: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xs,
  },
  requestsCountTextActive: {
    color: theme.colors.primary,
    fontFamily: theme.fonts.bold,
  },
  acceptColumn: {},
  declineColumn: {},
  searchContainer: {
    flex: 1,
  },
  input: {
    height: 40,
    marginVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.xl,
    borderWidth: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.input,
    borderColor: theme.colors.inputBorder,
    color: theme.colors.textSecondary,
  },
  smallButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
  },
  smallButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  smallButtonDanger: {
    borderWidth: 1,
    backgroundColor: theme.colors.dangerBackground,
    borderColor: theme.colors.dangerBorder,
  },
  smallButtonPrimaryText: {
    color: theme.colors.textOnPrimary,
  },
  smallButtonDangerText: {
    color: theme.colors.danger,
  },
});

type FriendTab = 'friends_list' | 'requests' | 'add_friends';

type Friend = {
  friendship_id: string;
  friend_user_id: string;
  display_name: string;
  avatar_url: string | null;
  friends_since: string;
};

type IncomingFriendRequest = {
  friendship_id: string;
  from_user_id: string;
  display_name: string;
  avatar_url: string | null;
  requested_at: string;
};

type OutgoingFriendRequest = {
  friendship_id: string;
  to_user_id: string;
  display_name: string;
  avatar_url: string | null;
  requested_at: string;
};

type ProfileSearchResult = {
  id: string;
  display_name: string;
  avatar_url: string | null;
};

const friendTabs: { value: FriendTab; label: string }[] = [
  {
    value: 'friends_list',
    label: 'Friends list',
  },
  {
    value: 'requests',
    label: 'Requests',
  },
  {
    value: 'add_friends',
    label: 'Add friends',
  },
];

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((c) => c.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');

type AvatarProps = {
  avatarUrl: string | null;
  displayName: string;
};

function Avatar({ avatarUrl, displayName }: AvatarProps) {
  return avatarUrl ? (
    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
  ) : (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitials}>
        {displayName ? getInitials(displayName) : 'U'}
      </Text>
    </View>
  );
}

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingFriendRequests, setIncomingFriendRequests] = useState<
    IncomingFriendRequest[]
  >([]);
  const [outgoingFriendRequests, setOutgoingFriendRequests] = useState<
    OutgoingFriendRequest[]
  >([]);
  const [currentTab, setCurrentTab] = useState<FriendTab>('friends_list');
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [isLoadingIncomingRequests, setIsLoadingIncomingRequests] =
    useState(false);
  const [isLoadingOutgoingRequests, setIsLoadingOutgoingRequests] =
    useState(false);
  const [friendRequestActionUserId, setFriendRequestActionUserId] = useState<
    string | null
  >(null);
  const [friendActionUserId, setFriendActionUserId] = useState<string | null>(
    null,
  );
  const [friendsErrorMessage, setFriendsErrorMessage] = useState<string | null>(
    null,
  );
  const [friendActionErrorMessage, setFriendActionErrorMessage] = useState<
    string | null
  >(null);
  const [incomingRequestsErrorMessage, setIncomingRequestsErrorMessage] =
    useState<string | null>(null);
  const [outgoingRequestsErrorMessage, setOutgoingRequestsErrorMessage] =
    useState<string | null>(null);
  const [friendRequestActionErrorMessage, setFriendRequestActionErrorMessage] =
    useState<string | null>(null);

  const [friendSearchText, setFriendSearchText] = useState<string>('');
  const [friendSearchResults, setFriendSearchResults] = useState<
    ProfileSearchResult[]
  >([]);
  const [isSearchingFriends, setIsSearchingFriends] = useState(false);
  const [friendSearchErrorMessage, setFriendSearchErrorMessage] = useState<
    string | null
  >(null);
  const [sendRequestErrorMessage, setSendRequestErrorMessage] = useState<
    string | null
  >(null);
  const [sendRequestUserId, setSendRequestUserId] = useState<string | null>(
    null,
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('getSession error:', error.message);
      }
      setUser(data.session?.user ?? null);
    });
  }, []);

  const loadFriends = async () => {
    setIsLoadingFriends(true);
    setFriendsErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('v_friends')
        .select(
          'friendship_id, friend_user_id, display_name, avatar_url, friends_since',
        )
        .order('display_name', { ascending: true });

      if (error) {
        setFriendsErrorMessage(error.message);
        return;
      }

      setFriends(data ?? []);
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const loadIncomingFriendRequests = async () => {
    setIsLoadingIncomingRequests(true);
    setIncomingRequestsErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('v_incoming_friend_requests')
        .select(
          'friendship_id, from_user_id, display_name, avatar_url, requested_at',
        )
        .order('requested_at', { ascending: false });

      if (error) {
        setIncomingRequestsErrorMessage(error.message);
        return;
      }

      setIncomingFriendRequests(data ?? []);
    } finally {
      setIsLoadingIncomingRequests(false);
    }
  };

  const loadOutgoingFriendRequests = async () => {
    setIsLoadingOutgoingRequests(true);
    setOutgoingRequestsErrorMessage(null);

    try {
      const { data, error } = await supabase
        .from('v_outgoing_friend_requests')
        .select(
          'friendship_id, to_user_id, display_name, avatar_url, requested_at',
        )
        .order('requested_at', { ascending: false });

      if (error) {
        setOutgoingRequestsErrorMessage(error.message);
        return;
      }

      setOutgoingFriendRequests(data ?? []);
    } finally {
      setIsLoadingOutgoingRequests(false);
    }
  };

  const removeFriend = async (friendId: string) => {
    setFriendActionUserId(friendId);
    setFriendActionErrorMessage(null);
    try {
      const { error } = await supabase.rpc('remove_friend', {
        p_other_user_id: friendId,
      });

      if (error) {
        setFriendActionErrorMessage(error.message);
        return;
      }

      await loadFriends();
    } finally {
      setFriendActionUserId(null);
    }
  };

  const acceptIncomingFriendRequest = async (fromUserId: string) => {
    setFriendRequestActionErrorMessage(null);
    setFriendRequestActionUserId(fromUserId);
    try {
      const { error } = await supabase.rpc('accept_friend_request', {
        p_from_user_id: fromUserId,
      });

      if (error) {
        setFriendRequestActionErrorMessage(error.message);
        return;
      }

      await Promise.all([
        loadIncomingFriendRequests(),
        loadFriends(),
        loadOutgoingFriendRequests(),
      ]);
    } finally {
      setFriendRequestActionUserId(null);
    }
  };

  const declineIncomingFriendRequest = async (fromUserId: string) => {
    setFriendRequestActionUserId(fromUserId);
    setFriendRequestActionErrorMessage(null);
    try {
      const { error } = await supabase.rpc('remove_friend', {
        p_other_user_id: fromUserId,
      });

      if (error) {
        setFriendRequestActionErrorMessage(error.message);
        return;
      }

      await Promise.all([
        loadIncomingFriendRequests(),
        loadFriends(),
        loadOutgoingFriendRequests(),
      ]);
    } finally {
      setFriendRequestActionUserId(null);
    }
  };

  const removeOutgoingFriendRequest = async (toUserId: string) => {
    setFriendRequestActionUserId(toUserId);
    setFriendRequestActionErrorMessage(null);
    try {
      const { error } = await supabase.rpc('remove_friend', {
        p_other_user_id: toUserId,
      });

      if (error) {
        setFriendRequestActionErrorMessage(error.message);
        return;
      }

      await Promise.all([
        loadIncomingFriendRequests(),
        loadFriends(),
        loadOutgoingFriendRequests(),
      ]);
    } finally {
      setFriendRequestActionUserId(null);
    }
  };

  const searchProfiles = async () => {
    if (!user) {
      return;
    }

    const trimmedSearchText = friendSearchText.trim();

    if (trimmedSearchText.length < 2) {
      setFriendSearchResults([]);
      return;
    }

    setIsSearchingFriends(true);
    setFriendSearchErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .neq('id', user.id)
        .ilike('display_name', `%${trimmedSearchText}%`)
        .order('display_name', { ascending: true })
        .limit(20);

      if (error) {
        setFriendSearchErrorMessage(error.message);
        return;
      }

      setFriendSearchResults(data ?? []);
    } finally {
      setIsSearchingFriends(false);
    }
  };

  const sendFriendRequest = async (friendId: string) => {
    setSendRequestUserId(friendId);
    setSendRequestErrorMessage(null);
    try {
      const { error } = await supabase.rpc('send_friend_request', {
        p_friend_id: friendId,
      });

      if (error) {
        setSendRequestErrorMessage(error.message);
        return;
      }

      setFriendSearchText('');
      setFriendSearchResults([]);
      await loadOutgoingFriendRequests();
    } finally {
      setSendRequestUserId(null);
    }
  };

  useEffect(() => {
    loadIncomingFriendRequests();
  }, []);

  useEffect(() => {
    if (currentTab === 'friends_list') {
      loadFriends();
    } else if (currentTab === 'requests') {
      loadIncomingFriendRequests();
    } else if (currentTab === 'add_friends') {
      loadOutgoingFriendRequests();
    }
  }, [currentTab]);

  useEffect(() => {
    searchProfiles();
  }, [friendSearchText, user]);

  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isHandlingThisRequest = friendActionUserId === item.friend_user_id;

    return (
      <View style={styles.friendRow}>
        <View style={styles.avatarColumn}>
          <Avatar avatarUrl={item.avatar_url} displayName={item.display_name} />
        </View>
        <Text style={styles.nameColumn}>{item.display_name}</Text>
        <View style={styles.declineColumn}>
          <TouchableOpacity
            disabled={isHandlingThisRequest}
            style={[styles.smallButton, styles.smallButtonDanger]}
            onPress={() => removeFriend(item.friend_user_id)}
          >
            <Text style={styles.smallButtonDangerText}>
              {isHandlingThisRequest ? 'Removing...' : 'Remove'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderIncomingFriendRequest = ({
    item,
  }: {
    item: IncomingFriendRequest;
  }) => {
    const isHandlingThisRequest =
      friendRequestActionUserId === item.from_user_id;
    return (
      <View style={styles.friendRow}>
        <View style={styles.avatarColumn}>
          <Avatar avatarUrl={item.avatar_url} displayName={item.display_name} />
        </View>
        <Text style={styles.nameColumn}>{item.display_name}</Text>
        <View style={styles.acceptColumn}>
          <TouchableOpacity
            style={[styles.smallButton, styles.smallButtonPrimary]}
            disabled={isHandlingThisRequest}
            onPress={() => acceptIncomingFriendRequest(item.from_user_id)}
          >
            <Text style={styles.smallButtonPrimaryText}>
              {isHandlingThisRequest ? 'Accepting...' : 'Accept'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.declineColumn}>
          <TouchableOpacity
            style={[styles.smallButton, styles.smallButtonDanger]}
            disabled={isHandlingThisRequest}
            onPress={() => declineIncomingFriendRequest(item.from_user_id)}
          >
            <Text style={styles.smallButtonDangerText}>
              {isHandlingThisRequest ? 'Working...' : 'Decline'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOutgoingFriendRequest = ({
    item,
  }: {
    item: OutgoingFriendRequest;
  }) => {
    const isHandlingThisRequest = friendRequestActionUserId === item.to_user_id;
    return (
      <View style={styles.friendRow}>
        <View style={styles.avatarColumn}>
          <Avatar avatarUrl={item.avatar_url} displayName={item.display_name} />
        </View>
        <Text style={styles.nameColumn}>{item.display_name}</Text>
        <View style={styles.acceptColumn}>
          <TouchableOpacity
            style={[styles.smallButton, styles.smallButtonDanger]}
            disabled={isHandlingThisRequest}
            onPress={() => removeOutgoingFriendRequest(item.to_user_id)}
          >
            <Text style={styles.smallButtonDangerText}>
              {isHandlingThisRequest ? 'Removing...' : 'Remove'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderProfileSearchResult = ({
    item,
  }: {
    item: ProfileSearchResult;
  }) => {
    const isHandlingThisRequest = sendRequestUserId === item.id;

    return (
      <View style={styles.friendRow}>
        <View style={styles.avatarColumn}>
          <Avatar avatarUrl={item.avatar_url} displayName={item.display_name} />
        </View>
        <Text style={styles.nameColumn}>{item.display_name}</Text>
        <View style={styles.declineColumn}>
          <TouchableOpacity
            disabled={isHandlingThisRequest}
            style={[styles.smallButton, styles.smallButtonPrimary]}
            onPress={() => sendFriendRequest(item.id)}
          >
            <Text style={styles.smallButtonPrimaryText}>
              {isHandlingThisRequest ? 'Sending...' : 'Send request'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  const incomingRequestCount = incomingFriendRequests.length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>
      <View style={styles.friendTabs}>
        {friendTabs.map((friendTab) => (
          <TouchableOpacity
            key={friendTab.value}
            onPress={() => setCurrentTab(friendTab.value)}
            style={[
              styles.friendTab,
              currentTab === friendTab.value && styles.friendTabActive,
            ]}
            accessibilityRole="button"
            accessibilityState={{
              selected: currentTab === friendTab.value,
            }}
          >
            <View style={styles.friendTabContent}>
              <Text
                style={[
                  styles.friendTabText,
                  currentTab === friendTab.value && styles.friendTabTextActive,
                ]}
              >
                {friendTab.label}{' '}
              </Text>
              {friendTab.value === 'requests' && incomingRequestCount > 0 && (
                <View
                  style={[
                    styles.requestsCount,
                    currentTab === friendTab.value &&
                      styles.requestsCountActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.requestsCountText,
                      currentTab === friendTab.value &&
                        styles.requestsCountTextActive,
                    ]}
                  >
                    {incomingRequestCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {currentTab === 'friends_list' && (
        <View style={styles.listContainer}>
          {isLoadingFriends ? (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View>
              {friendsErrorMessage && (
                <Text style={styles.errorText}>
                  Could not load friends: {friendsErrorMessage}
                </Text>
              )}
              {friendActionErrorMessage && (
                <Text style={styles.errorText}>
                  Error when trying to remove friend: {friendActionErrorMessage}
                </Text>
              )}

              <FlatList
                data={friends}
                keyExtractor={(friend) => friend.friendship_id}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>No friends yet.</Text>
                )}
                renderItem={renderFriendItem}
                ItemSeparatorComponent={() => (
                  <View style={styles.listSeparator} />
                )}
                contentContainerStyle={styles.listContent}
              />
            </View>
          )}
        </View>
      )}
      {currentTab === 'requests' && (
        <View style={styles.listContainer}>
          {isLoadingIncomingRequests ? (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : incomingRequestsErrorMessage ? (
            <Text style={styles.errorText}>
              Could not load incoming friend requests:{' '}
              {incomingRequestsErrorMessage}
            </Text>
          ) : (
            <View>
              <View>
                {friendRequestActionErrorMessage && (
                  <Text style={styles.errorText}>
                    Could not update friend request:{' '}
                    {friendRequestActionErrorMessage}
                  </Text>
                )}
              </View>
              <FlatList
                data={incomingFriendRequests}
                keyExtractor={(friendRequest) => friendRequest.friendship_id}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>
                    No incoming friend requests at the moment.
                  </Text>
                )}
                renderItem={renderIncomingFriendRequest}
                ItemSeparatorComponent={() => (
                  <View style={styles.listSeparator} />
                )}
                contentContainerStyle={styles.listContent}
              />
            </View>
          )}
        </View>
      )}
      {currentTab === 'add_friends' && (
        <View style={styles.searchContainer}>
          <TextInput
            value={friendSearchText}
            style={styles.input}
            onChangeText={(newText) => setFriendSearchText(newText)}
            placeholder="Search"
          />
          {friendSearchText.trim().length >= 2 &&
            (isSearchingFriends ? (
              <View style={styles.loadingIndicator}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            ) : friendSearchErrorMessage ? (
              <Text style={styles.errorText}>
                Search caused an error: {friendSearchErrorMessage}
              </Text>
            ) : (
              <FlatList
                data={friendSearchResults}
                keyExtractor={(friend) => friend.id}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>
                    No users found with that name.
                  </Text>
                )}
                renderItem={renderProfileSearchResult}
                ItemSeparatorComponent={() => (
                  <View style={styles.listSeparator} />
                )}
                contentContainerStyle={styles.listContent}
              />
            ))}

          <Text style={styles.smallTitle}>Outgoing friend requests</Text>
          {isLoadingOutgoingRequests ? (
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <View>
              {outgoingRequestsErrorMessage && (
                <Text style={styles.errorText}>
                  Could not load outgoing friend requests:{' '}
                  {outgoingRequestsErrorMessage}
                </Text>
              )}
              {sendRequestErrorMessage && (
                <Text style={styles.errorText}>
                  Could not send friend request: {sendRequestErrorMessage}
                </Text>
              )}
              <FlatList
                data={outgoingFriendRequests}
                keyExtractor={(friendRequest) => friendRequest.friendship_id}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>
                    No outgoing friend requests at the moment.
                  </Text>
                )}
                renderItem={renderOutgoingFriendRequest}
                ItemSeparatorComponent={() => (
                  <View style={styles.listSeparator} />
                )}
                contentContainerStyle={styles.listContent}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}
