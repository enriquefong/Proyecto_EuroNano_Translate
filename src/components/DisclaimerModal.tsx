/**
 * DisclaimerModal — First-use warning about AI translation limitations
 *
 * Non-dismissable on first use per §6 of the design document.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius, shadows } from '../theme/theme';

interface DisclaimerModalProps {
  visible: boolean;
  onAccept: () => void;
}

export function DisclaimerModal({ visible, onAccept }: DisclaimerModalProps) {
  const [canDismiss, setCanDismiss] = useState(false);

  // Force user to wait 3 seconds before accepting
  useEffect(() => {
    if (visible) {
      setCanDismiss(false);
      const timer = setTimeout(() => setCanDismiss(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Feather name="alert-triangle" size={48} color={colors.accent.warning} />
          </View>

          <Text style={styles.title}>Aviso importante</Text>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>
              Esta traducción es generada por un modelo de IA local compacto{' '}
              <Text style={styles.bold}>(TranslatePsy-EuroNano)</Text>.
            </Text>

            <Text style={styles.body}>
              Puede contener errores, especialmente en:
            </Text>

            <View style={styles.bulletList}>
              <Text style={styles.bullet}>• Frases largas o complejas</Text>
              <Text style={styles.bullet}>• Jerga, modismos o expresiones coloquiales</Text>
              <Text style={styles.bullet}>• Textos técnicos, médicos o legales</Text>
              <Text style={styles.bullet}>• Idiomas con menor cobertura de entrenamiento</Text>
            </View>

            <View style={styles.warningBox}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <Feather name="x-circle" size={18} color={colors.accent.error} style={{ marginTop: 2 }} />
                <Text style={[styles.warningText, { flex: 1 }]}>
                  No sustituye a un intérprete humano certificado en contextos
                  de alto riesgo (salud, procesos legales, migración).
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: spacing.base }}>
              <Feather name="lock" size={20} color={colors.accent.success} />
              <Text style={[styles.privacyText, { marginBottom: 0 }]}>
                Toda la traducción se ejecuta en tu dispositivo.{'\n'}
                Ni el audio ni el texto salen del teléfono.
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.acceptButton,
              !canDismiss && styles.acceptButtonDisabled,
            ]}
            onPress={onAccept}
            disabled={!canDismiss}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.acceptText,
              !canDismiss && styles.acceptTextDisabled,
            ]}>
              {canDismiss ? 'Entendido, continuar' : 'Leyendo aviso...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    backgroundColor: colors.bg.secondary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
    maxWidth: 420,
    width: '100%',
    maxHeight: '80%',
    ...shadows.lg,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: spacing.base,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: spacing.base,
  },
  scrollContent: {
    maxHeight: 320,
  },
  body: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  bold: {
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  bulletList: {
    marginBottom: spacing.base,
    paddingLeft: spacing.sm,
  },
  bullet: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    lineHeight: typography.sizes.base * typography.lineHeights.relaxed,
    marginBottom: spacing.xs,
  },
  warningBox: {
    backgroundColor: colors.accent.error + '10',
    borderWidth: 1,
    borderColor: colors.accent.error + '30',
    borderRadius: borderRadius.md,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.accent.error,
    fontFamily: typography.fonts.medium,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  privacyText: {
    fontSize: typography.sizes.sm,
    color: colors.accent.success,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.base,
  },
  acceptButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  acceptButtonDisabled: {
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  acceptText: {
    fontSize: typography.sizes.base,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
  },
  acceptTextDisabled: {
    color: colors.text.tertiary,
  },
});

export default DisclaimerModal;
