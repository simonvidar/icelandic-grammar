import { theme } from '@/src/theme/theme';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.textPrimary,
    fontFamily: theme.fonts.semiBold,
  },
  menu: {
    marginTop: theme.spacing.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.button,
    overflow: 'hidden',
  },
  option: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  optionActive: {
    backgroundColor: theme.colors.secondaryBackground,
  },
  optionText: {
    color: theme.colors.textSecondary,
    fontFamily: theme.fonts.semiBold,
  },
  optionTextActive: {
    color: theme.colors.primary,
  },
});

type Option<T extends string> = {
  value: T;
  label: string;
};

type DropdownProps<T extends string> = {
  options: Option<T>[];
  selectedOption: Option<T>;
  onSelect: (selectedValue: T) => void;
};

export default function Dropdown<T extends string>({
  options,
  selectedOption,
  onSelect,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsOpen((current) => !current)}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="Select"
      >
        <Text style={styles.buttonText}>{selectedOption.label}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.menu}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                onSelect(option.value);
                setIsOpen(false);
              }}
              style={[
                styles.option,
                selectedOption.value === option.value && styles.optionActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{
                selected: selectedOption.value === option.value,
              }}
            >
              <Text
                style={[
                  styles.optionText,
                  selectedOption.value === option.value &&
                    styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
