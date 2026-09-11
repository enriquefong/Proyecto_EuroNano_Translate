/**
 * LanguageSelector — Reusable language picker component
 *
 * Displays a scrollable list of supported languages with flags,
 * native names, and COMET quality indicators.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SUPPORTED_LANGUAGES, type Language } from '../engine/model-constants';
import { colors, typography, spacing, borderRadius, shadows, glassStyles } from '../theme/theme';

interface LanguageSelectorProps {
  selectedCode: string;
  onSelect: (lang: Language) => void;
  label?: string;
  excludeCode?: string;
  accentColor?: string;
}

export function LanguageSelector({
  selectedCode,
  onSelect,
  label,
  excludeCode,
  accentColor = colors.accent.primary,
}: LanguageSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const selectedLang = SUPPORTED_LANGUAGES.find(l => l.code === selectedCode);
  const filteredLanguages = excludeCode
    ? SUPPORTED_LANGUAGES.filter(l => l.code !== excludeCode)
    : SUPPORTED_LANGUAGES;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  };

  const handleSelect = (lang: Language) => {
    onSelect(lang);
    setModalVisible(false);
  };

  return (
    <View>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={() => setModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.selector, { borderColor: accentColor + '40' }]}
        >
          <Text style={styles.flag}>{selectedLang?.flag}</Text>
          <View style={styles.langInfo}>
            <Text style={styles.langName}>{selectedLang?.nativeName}</Text>
            <Text style={styles.langCode}>{selectedLang?.code.toUpperCase()}</Text>
          </View>
          <Feather name="chevron-down" size={16} color={accentColor} style={{ opacity: 0.8 }} />
        </Pressable>
      </Animated.View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Seleccionar idioma</Text>

            <FlatList
              data={filteredLanguages}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    item.code === selectedCode && {
                      backgroundColor: accentColor + '15',
                      borderColor: accentColor + '30',
                    },
                  ]}
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langItemFlag}>{item.flag}</Text>
                  <View style={styles.langItemInfo}>
                    <Text style={styles.langItemName}>{item.nativeName}</Text>
                    <Text style={styles.langItemEnglishName}>{item.name}</Text>
                  </View>
                  <Text style={styles.langItemCode}>{item.code.toUpperCase()}</Text>
                  {item.code === selectedCode && (
                    <Feather name="check" size={20} color={accentColor} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.bg,
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    gap: spacing.md,
  },
  flag: {
    fontSize: 28,
  },
  langInfo: {
    flex: 1,
  },
  langName: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontFamily: typography.fonts.semibold,
  },
  langCode: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.medium,
    marginTop: 2,
    letterSpacing: 1,
  },
  chevron: {
    fontSize: 12,
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bg.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing['2xl'],
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.text.tertiary,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    opacity: 0.5,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: spacing.base,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  langItemFlag: {
    fontSize: 32,
  },
  langItemInfo: {
    flex: 1,
  },
  langItemName: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: typography.fonts.semibold,
  },
  langItemEnglishName: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.regular,
    marginTop: 2,
  },
  langItemCode: {
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fonts.medium,
    letterSpacing: 1,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LanguageSelector;
