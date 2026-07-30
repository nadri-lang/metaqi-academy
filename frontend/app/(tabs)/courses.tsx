import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '@/src/context/LanguageContext';

interface Course {
  id: string;
  title: string;
  price: string;
  description: string;
  icon: string;
}

const COURSES: Course[] = [
  {
    id: '1',
    title: 'Curso Básico BAZI - Carta Natal y los 12 Animales',
    price: '19,90€',
    description: 'Aprende a interpretar tu Carta Natal BaZi y descubre cómo los 12 animales del zodiaco influyen en tu personalidad, talentos, relaciones, oportunidades y ciclos de vida.',
    icon: 'sparkles',
  },
  {
    id: '2',
    title: 'Curso Básico Qi Men Dun Jia',
    price: '19,90€',
    description: 'Conoce tu Carta Natal Qi Men y descubre cómo aprovechar tus fortalezas, superar obstáculos, descubrir tus puntos débiles y aplicar estrategias para tomar mejores decisiones.',
    icon: 'compass',
  },
  {
    id: '3',
    title: 'Curso de los 5 Elementos - Equilibrio y Energía',
    price: '19,90€',
    description: 'Aprende cómo interactúan los Cinco Elementos y descubre cómo equilibrar tu energía para potenciar la salud, las relaciones, la prosperidad y el bienestar.',
    icon: 'flame',
  },
  {
    id: '4',
    title: 'Curso del Número Personal Gua - Direcciones y Energía Personal',
    price: '9,90€',
    description: 'Descubre tu Número Personal Gua y aprende a utilizar tus direcciones favorables para potenciar la salud, las relaciones, la prosperidad y el éxito.',
    icon: 'navigate',
  },
  {
    id: '5',
    title: 'Curso Básico I Ching – El Oráculo de la Sabiduría',
    price: '19,90€',
    description: 'Aprende a consultar e interpretar el I Ching para comprender las situaciones de tu vida, tomar mejores decisiones y encontrar la orientación más adecuada en cada momento.',
    icon: 'book',
  },
];

export default function CoursesScreen() {
  const { language } = useLanguage();
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const handleWhatsAppContact = (courseTitle: string) => {
    const message = language === 'es'
      ? `Hola, me interesa este curso: ${courseTitle}. ¿Podríais enviarme el temario, por favor? Me gustaría conocer los contenidos antes de realizar la inscripción. Muchas gracias.`
      : `Hello, I'm interested in this course: ${courseTitle}. Could you send me the syllabus, please? I would like to know the contents before enrolling. Thank you very much.`;
    
    // Get WhatsApp from app config (hardcoded for now, can be loaded from API)
    const whatsapp = '34640510085';
    Linking.openURL(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={Gradients.navy} style={styles.header}>
        <Text style={styles.headerLabel}>
          {language === 'es' ? 'APRENDE' : 'LEARN'}
        </Text>
        <Text style={styles.headerTitle}>
          {language === 'es' ? 'Cursos' : 'Courses'}
        </Text>
      </LinearGradient>

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
                <MaterialCommunityIcons name={course.icon as any} size={28} color={Colors.accent} />
              </View>
              <View style={styles.courseTextContainer}>
                <Text style={styles.courseTitle} numberOfLines={2}>
                  {course.title}
                </Text>
                <Text style={styles.coursePrice}>{course.price}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textLight} />
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

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
                    <View style={styles.modalIconContainer}>
                      <MaterialCommunityIcons name={selectedCourse.icon as any} size={32} color={Colors.accent} />
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
                    <Text style={styles.modalTitle}>{selectedCourse.title}</Text>
                    <Text style={styles.modalPrice}>{selectedCourse.price}</Text>
                    
                    <View style={styles.divider} />
                    
                    <Text style={styles.modalDescription}>{selectedCourse.description}</Text>

                    {/* Notice */}
                    <View style={styles.noticeCard}>
                      <MaterialCommunityIcons name="information" size={24} color={Colors.accent} />
                      <Text style={styles.noticeText}>
                        {language === 'es'
                          ? 'Una vez confirmado el pago, el curso se activará en tu sección "Mis Compras" con acceso al vídeo del curso.'
                          : 'Once payment is confirmed, the course will be activated in your "My Purchases" section with access to the course video.'}
                      </Text>
                    </View>

                    {/* WhatsApp Contact Button */}
                    <TouchableOpacity
                      style={styles.whatsappButton}
                      onPress={() => {
                        handleWhatsAppContact(selectedCourse.title);
                        setSelectedCourse(null);
                      }}
                      activeOpacity={0.85}
                    >
                      <MaterialCommunityIcons name="whatsapp" size={24} color={Colors.white} />
                      <Text style={styles.whatsappButtonText}>
                        {language === 'es' 
                          ? 'Solicitar Información / Comprar por WhatsApp'
                          : 'Request Information / Buy via WhatsApp'}
                      </Text>
                    </TouchableOpacity>

                    {/* Back Button */}
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setSelectedCourse(null)}
                    >
                      <Text style={styles.backButtonText}>
                        {language === 'es' ? 'Volver' : 'Back'}
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
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: Colors.accent + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  noticeText: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
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
