import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  // Not logged in view
  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.navy} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Text style={styles.headerLabel}>Bienvenido a</Text>
              <Text style={styles.headerTitle}>MetaQi Academy</Text>
              <Text style={styles.headerSubtitle}>
                Crea tu cuenta para acceder a favoritos, cursos y servicios exclusivos
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity
            testID="profile-login-btn"
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Ionicons name="log-in" size={20} color={Colors.primary} />
            <Text style={styles.primaryButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            testID="profile-register-btn"
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.secondaryButtonText}>Crear Cuenta Nueva</Text>
          </TouchableOpacity>

          {/* Benefits Section */}
          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>Beneficios de crear tu cuenta</Text>
            
            <View style={styles.benefitItem}>
              <Ionicons name="heart" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>Favoritos</Text>
                <Text style={styles.benefitDesc}>Guarda artículos y contenido</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="book" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>Progreso de Cursos</Text>
                <Text style={styles.benefitDesc}>Guarda tu avance</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="sparkles" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>Servicios Personalizados</Text>
                <Text style={styles.benefitDesc}>Solicita lecturas BaZi, Qi Men, rituales</Text>
              </View>
            </View>

            <View style={styles.benefitItem}>
              <Ionicons name="star" size={20} color={Colors.accent} />
              <View style={styles.benefitTextContainer}>
                <Text style={styles.benefitLabel}>Contenido Premium</Text>
                <Text style={styles.benefitDesc}>Accede a agendas y cursos exclusivos</Text>
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <TouchableOpacity style={styles.infoItem} testID="info-about-btn">
              <Ionicons name="information-circle" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>Sobre Nosotros</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoItem} testID="info-faq-btn">
              <Ionicons name="help-circle" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>Preguntas Frecuentes</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoItem} testID="info-contact-btn">
              <Ionicons name="mail" size={20} color={Colors.textSecondary} />
              <Text style={styles.infoText}>Contacto</Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Logged in view
  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.userHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="person" size={40} color={Colors.accent} />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>

            {user.has_active_subscription ? (
              <View style={styles.premiumBadge}>
                <Ionicons name="star" size={14} color={Colors.primary} />
                <Text style={styles.premiumBadgeText}>Miembro Premium</Text>
              </View>
            ) : (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>Miembro Gratuito</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} testID="menu-favorites">
            <Ionicons name="heart" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>Mis Favoritos</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} testID="menu-progress">
            <Ionicons name="book" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>Mi Progreso</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} testID="menu-purchases">
            <Ionicons name="receipt" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>Mis Compras</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} testID="menu-requests">
            <Ionicons name="sparkles" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>Mis Solicitudes</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} testID="menu-language">
            <Ionicons name="language" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>Idioma</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          <TouchableOpacity style={styles.menuItem} testID="menu-about">
            <Ionicons name="information-circle" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>Sobre Nosotros</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} testID="menu-faq">
            <Ionicons name="help-circle" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>FAQ</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} testID="menu-contact">
            <Ionicons name="mail" size={22} color={Colors.textSecondary} />
            <Text style={styles.menuText}>Contacto</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          testID="logout-btn"
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 22,
  },
  userHeader: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.white,
    opacity: 0.7,
    marginBottom: Spacing.md,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  premiumBadgeText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  freeBadge: {
    backgroundColor: Colors.white + '20',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  freeBadgeText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.white,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  secondaryButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.accent,
  },
  benefitsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  benefitsTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  benefitTextContainer: { flex: 1 },
  benefitLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  benefitDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  infoSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  menuSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
    gap: Spacing.md,
  },
  menuText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  logoutText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.error,
  },
});
