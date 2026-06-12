import { theme } from '@/src/theme/theme';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

const styles = StyleSheet.create({
  button: {
    width: '100%',
    marginTop: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: theme.fonts.semiBold,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondaryBackground,
  },
  dangerButton: {
    backgroundColor: theme.colors.dangerBackground,
    borderWidth: 1,
    borderColor: theme.colors.dangerBorder,
  },
  primaryText: {
    color: theme.colors.textOnPrimary,
  },
  secondaryText: {
    color: theme.colors.primary,
  },
  dangerText: {
    color: theme.colors.danger,
  },
});

type AppButtonProps = {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel?: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export default function AppButton({
  children,
  onPress,
  accessibilityLabel,
  variant = 'primary',
}: AppButtonProps) {
  const buttonVariantStyle = {
    primary: styles.primaryButton,
    secondary: styles.secondaryButton,
    danger: styles.dangerButton,
  };

  const textVariantStyle = {
    primary: styles.primaryText,
    secondary: styles.secondaryText,
    danger: styles.dangerText,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, buttonVariantStyle[variant]]}
      accessibilityLabel={accessibilityLabel}
    >
      <Text style={[styles.buttonText, textVariantStyle[variant]]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}
