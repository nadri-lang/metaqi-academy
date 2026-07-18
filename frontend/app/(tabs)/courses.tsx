import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import api from '@/src/services/api';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  is_premium: boolean;
  level: string;
}

interface PremiumAgenda {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  materials: string[];
}

export default function CoursesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [agendas, setAgendas] = useState<PremiumAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'courses' | 'agendas'>('courses');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesRes, agendasRes] = await Promise.allSettled([
        api.get('/courses'),
        api.get('/agendas'),
      ]);
      if (coursesRes.status === 'fulfilled') setCourses(coursesRes.value.data);
      if (agendasRes.status === 'fulfilled') setAgendas(agendasRes.value.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <Text style={styles.headerLabel}>Aprende</Text>
        <Text style={styles.headerTitle}>Cursos & Agendas</Text>
      </LinearGradient>

      <View style={styles.tabRow}>
        <TouchableOpacity
          testID="tab-courses"
          style={[styles.tab, tab === 'courses' && styles.tabActive]}
          onPress={() => setTab('courses')}
        >
          <Text style={[styles.tabText, tab === 'courses' && styles.tabTextActive]}>
            Cursos ({courses.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-agendas"
          style={[styles.tab, tab === 'agendas' && styles.tabActive]}
          onPress={() => setTab('agendas')}
        >
          <Text style={[styles.tabText, tab === 'agendas' && styles.tabTextActive]}>
            Agendas ({agendas.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'courses' && (
          <>
            {courses.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="school-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyText}>Pronto tendremos cursos disponibles</Text>
              </View>
            ) : (
              courses.map((course) => (
                <TouchableOpacity
                  key={course.id}
                  style={styles.card}
                  testID={`course-card-${course.id}`}
                  onPress={() => user ? router.push(`/course/${course.id}`) : router.push('/(auth)/login')}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.levelBadge}>
                      <Text style={styles.levelText}>{course.level}</Text>
                    </View>
                    {course.is_premium && (
                      <View style={styles.premiumBadge}>
                        <Ionicons name="star" size={12} color={Colors.primary} />
                        <Text style={styles.premiumText}>Premium</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardTitle}>{course.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={3}>{course.description}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>
                      {course.price > 0 ? `€${course.price.toFixed(0)}` : 'Gratis'}
                    </Text>
                    <Ionicons name="arrow-forward" size={18} color={Colors.accent} />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {tab === 'agendas' && (
          <>
            {agendas.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color={Colors.textLight} />
                <Text style={styles.emptyText}>Pronto tendremos agendas disponibles</Text>
              </View>
            ) : (
              agendas.map((agenda) => (
                <TouchableOpacity
                  key={agenda.id}
                  style={styles.card}
                  testID={`agenda-card-${agenda.id}`}
                  onPress={() => router.push(`/agenda/${agenda.id}`)}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconWrap}>
                      <Ionicons name="calendar" size={20} color={Colors.accent} />
                    </View>
                    <View style={styles.premiumBadge}>
                      <Text style={styles.premiumText}>{agenda.type === 'annual' ? 'Anual' : 'Mensual'}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardTitle}>{agenda.title}</Text>
                  <Text style={styles.cardDesc} numberOfLines={3}>{agenda.description}</Text>
                  
                  {agenda.materials.length > 0 && (
                    <View style={styles.materialsSection}>
                      {agenda.materials.slice(0, 3).map((item, i) => (
                        <View key={i} style={styles.materialItem}>
                          <Ionicons name="checkmark-circle" size={14} color={Colors.jade} />
                          <Text style={styles.materialText}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardPrice}>€{agenda.price.toFixed(0)}</Text>
                    <View style={styles.viewButton}>
                      <Text style={styles.viewButtonText}>Ver detalles</Text>
                      <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
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
    fontSize: Typography['2xl'],
    color: Colors.white,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  tabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  tabText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  tabTextActive: { color: Colors.primary },
  content: { padding: Spacing.lg },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['3xl'] },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: Colors.jade + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  levelText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.jade,
    textTransform: 'capitalize',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  premiumText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.primary,
    marginLeft: 3,
  },
  cardTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  cardDesc: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  materialsSection: { marginBottom: Spacing.md },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  materialText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  cardPrice: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.accent,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  viewButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
});
