import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';
import { useAuth } from '@/src/context/AuthContext';
import { BaziPillarsIcon, FiveElementsIcon, GuaIcon } from '@/src/components/CourseIcons';

interface Course {
  id: string;
  titleKey: string;
  price: string;
  descriptionKey: string;
  icon: string;
}

// 'sparkles', 'flame' and 'navigate' aren't valid MaterialCommunityIcons glyph
// names (they're Ionicons names) - MaterialCommunityIcons silently rendered
// them as "?" placeholders. These three now render a purpose-built SVG icon
// via CourseIcon below instead of a font glyph.
const CUSTOM_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'bazi-pillars': BaziPillarsIcon,
  'five-elements': FiveElementsIcon,
  'gua-badge': GuaIcon,
};

function CourseIcon({ icon, size, color }: { icon: string; size: number; color: string }) {
  const CustomIcon = CUSTOM_ICONS[icon];
  if (CustomIcon) {
    return <CustomIcon size={size} color={color} />;
  }
  return <MaterialCommunityIcons name={icon as any} size={size} color={color} />;
}

const COURSES: Course[] = [
  {
    id: '1',
    titleKey: 'courses.bazi_basic_title',
    price: '19,90€',
    descriptionKey: 'courses.bazi_basic_desc',
    icon: 'bazi-pillars',
  },
  {
    id: '2',
    titleKey: 'courses.qimen_basic_title',
    price: '19,90€',
    descriptionKey: 'courses.qimen_basic_desc',
    icon: 'compass',
  },
  {
    id: '3',
    titleKey: 'courses.five_elements_title',
    price: '19,90€',
    descriptionKey: 'courses.five_elements_desc',
    icon: 'five-elements',
  },
  {
    id: '4',
    titleKey: 'courses.gua_number_title',
    price: '9,90€',
    descriptionKey: 'courses.gua_number_desc',
    icon: 'gua-badge',
  },
  {
    id: '5',
    titleKey: 'courses.iching_basic_title',
    price: '19,90€',
    descriptionKey: 'courses.iching_basic_desc',
    icon: 'book',
  },
];

export default function CoursesScreen() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const isAdmin = user?.role === 'admin';

  const handleBuyCourse = (courseTitleKey: string) => {
    // No in-app checkout yet - external WhatsApp payment for this kind of
    // in-app digital content isn't Play Billing compliant (see the Wedding
    // Agenda 2027 screen, fixed the same way).
    Alert.alert(t(courseTitleKey), t('courses.buy_coming_soon'));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <Text style={styles.headerLabel}>
          {t('courses.label')}
        </Text>
        <Text style={styles.headerTitle}>
          {t('courses.title')}
        </Text>
        {!isAdmin && (
          <Text style={styles.comingSoonBadge}>{t('courses.empty_title')}</Text>
        )}
      </LinearGradient>

      {!isAdmin ? (
        <View style={styles.comingSoonContainer}>
          <MaterialCommunityIcons name="clock-outline" size={64} color={Colors.textLight} />
          <Text style={styles.comingSoonTitle}>{t('courses.empty_title')}</Text>
          <Text style={styles.comingSoonText}>{t('courses.empty_text')}</Text>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {COURSES.map((course) => (
          <TouchableOpacity
            key={course.id}
            style={styles.courseButton}
            onPress={() => setSelectedCourse(course)}
            activeOpacity={0.85}
          >
            <View style={styles.courseButtonContent}>
              <View style={styles.courseIconContainer}>
                <CourseIcon icon={course.icon} size={28} color={Colors.accent} />
              </View>
              <View style={styles.courseTextContainer}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {t(course.titleKey)}
                </Text>
                <Text style={styles.coursePrice}>{course.price}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
      )}

      {/* Course Detail Modal */}
      <Modal
        visible={selectedCourse !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedCourse(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <SafeAreaView edges={['bottom']}>
              {selectedCourse && (
                <>
                  {/* Modal Header */}
                  <View style={styles.modalHeader}>
                    <View style={styles.modalHeaderLeft}>
                      <TouchableOpacity
                        testID="modal-back-button"
                        style={styles.modalBackArrow}
                        onPress={() => setSelectedCourse(null)}
                        activeOpacity={0.7}
                      >
                        <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.textSecondary} />
                      </TouchableOpacity>
                      <View style={styles.modalIconContainer}>
                        <CourseIcon icon={selectedCourse.icon} size={32} color={Colors.accent} />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setSelectedCourse(null)}
                    >
                      <MaterialCommunityIcons name="close" size={28} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.modalContent}
                  >
                    <Text style={styles.modalTitle}>{t(selectedCourse.titleKey)}</Text>
                    <Text style={styles.modalPrice}>{selectedCourse.price}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.modalDescription}>{t(selectedCourse.descriptionKey)}</Text>

                    {/* Buy Button */}
                    <TouchableOpacity
                      style={styles.whatsappButton}
                      onPress={() => {
                        handleBuyCourse(selectedCourse.titleKey);
                      }}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="star" size={24} color={Colors.white} />
                      <Text style={styles.whatsappButtonText}>
                        {t('courses.buy_coming_soon')}
                      </Text>
                    </TouchableOpacity>

                    {/* Back Button */}
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setSelectedCourse(null)}
                    >
                      <Text style={styles.backButtonText}>
                        {t('common.back')}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ height: Spacing.xl }} />
                  </ScrollView>
                </>
              )}
            </SafeAreaView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xl },
  headerLabel: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.xs,
    color: Colors.accent,
    letterSpacing: 2,
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.white,
  },
  content: { padding: Spacing.lg },
  comingSoonBadge: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
    marginTop: Spacing.xs,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  comingSoonTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  comingSoonText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  // Course Buttons (Vertical List with Blue Border & Shadow)
  courseButton: {
    borderRadius: BorderRadius.xl,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: Spacing.md,
  },
  courseButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  courseIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseTextContainer: {
    flex: 1,
  },
  courseTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    lineHeight: 22,
    marginBottom: 4,
  },
  coursePrice: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.accent,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalBackArrow: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['2xl'],
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.sm,
  },
  modalPrice: {
    fontFamily: Typography.serifBold,
    fontSize: Typography['3xl'],
    color: Colors.accent,
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.cardBorder,
    marginVertical: Spacing.lg,
  },
  modalDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 26,
    marginBottom: Spacing.lg,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  whatsappButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.white,
    textAlign: 'center',
    flex: 1,
  },
  backButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  backButtonText: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
});
