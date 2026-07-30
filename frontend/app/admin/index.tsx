import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

interface AdminSection {
  title: string;
  description: string;
  icon: string;
  route: string;
  testID: string;
}

const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: 'Energía del Día',
    description: 'Programar días por adelantado',
    icon: 'sunny',
    route: '/admin/daily-energy',
    testID: 'admin-daily-energy',
  },
  {
    title: 'Energía del Mes',
    description: 'Actualizar mes actual',
    icon: 'calendar',
    route: '/admin/month-energy',
    testID: 'admin-month-energy',
  },
  {
    title: 'Energía del Año',
    description: 'Actualizar año actual',
    icon: 'sparkles',
    route: '/admin/year-energy',
    testID: 'admin-year-energy',
  },
  {
    title: 'Talento del Bebé',
    description: 'Contenido diario de vocación',
    icon: 'star',
    route: '/admin/newborn-vocation',
    testID: 'admin-newborn-vocation',
  },
  {
    title: 'Agenda de Bodas',
    description: 'Fechas auspiciosas 2027',
    icon: 'heart',
    route: '/admin/wedding-agenda',
    testID: 'admin-wedding-agenda',
  },
  {
    title: 'Conceptos Metafísica',
    description: 'BaZi, Qi Men, Feng Shui...',
    icon: 'book',
    route: '/admin/concepts',
    testID: 'admin-concepts',
  },
  {
    title: 'Configuración de la App',
    description: 'Email, WhatsApp, textos promocionales',
    icon: 'settings',
    route: '/admin/app-config',
    testID: 'admin-app-config',
  },
  {
    title: 'Cursos',
    description: 'Gestionar cursos y lecciones',
    icon: 'school',
    route: '/admin/courses',
    testID: 'admin-courses',
  },
  {
    title: 'Servicios',
    description: 'Servicios personalizados',
    icon: 'briefcase',
    route: '/admin/services',
    testID: 'admin-services',
  },
  {
    title: 'Usuarios',
    description: 'Administrar usuarios',
    icon: 'people',
    route: '/admin/users',
    testID: 'admin-users',
  },
];

export default function AdminScreen() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.deniedContainer}>
          <MaterialCommunityIcons name="lock" size={64} color={Colors.error} />
          <Text style={styles.deniedTitle}>Acceso denegado</Text>
          <Text style={styles.deniedText}>Solo administradores pueden acceder</Text>
          <TouchableOpacity 
            style={styles.backButton2}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerNav}>
            <TouchableOpacity
              testID="admin-back-btn"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>Panel Admin</Text>
            <Text style={styles.headerTitle}>MetaQi CMS</Text>
            <Text style={styles.headerSubtitle}>
              Gestiona el contenido de la app
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {ADMIN_SECTIONS.map((section) => (
            <TouchableOpacity
              key={section.route}
              testID={section.testID}
              style={styles.gridItem}
              onPress={() => router.push(section.route as any)}
            >
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name={section.icon as any} size={26} color={Colors.accent} />
              </View>
              <Text style={styles.itemTitle}>{section.title}</Text>
              <Text style={styles.itemDesc} numberOfLines={2}>{section.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.xl },
  headerNav: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
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
  },
  content: {
    padding: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  gridItem: {
    width: '47%',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    minHeight: 130,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  itemTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  itemDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  deniedTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  deniedText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  backButton2: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
