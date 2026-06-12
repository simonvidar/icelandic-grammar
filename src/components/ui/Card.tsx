import { theme } from '@/src/theme/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  card: {
    width: '92%',
    marginVertical: theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,

    // shadow
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}
