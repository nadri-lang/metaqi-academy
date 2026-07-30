import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

interface CustomService {
  id: string;
  title: string;
  description: string;
  includes: string[];
  price: number;
  original_price?: number;
  is_offer?: boolean;
  is_active: boolean;
}

export default function AdminServicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [services, setServices] = useState<CustomService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<CustomService | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [isOffer, setIsOffer] = useState(false);
  const [includes, setIncludes] = useState('');

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadServices();
    }
  }, [user]);

  const loadServices = async () => {
    try {
      // Cargar todos los servicios incluyendo inactivos para el admin
      const response = await api.get('/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (service: CustomService) => {
    setSelectedService(service);
    setTitle(service.title);
    setDescription(service.description);
    setPrice(String(service.price));
    setOriginalPrice(service.original_price ? String(service.original_price) : '');
    setIsOffer(service.is_offer || false);
    setIncludes((service.includes || []).join('\n'));
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedService) return;

    if (!title.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Error', 'Título, descripción y precio son obligatorios');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        price: parseFloat(price),
        original_price: originalPrice.trim() ? parseFloat(originalPrice) : undefined,
        is_offer: isOffer,
        includes: includes.split('\n').filter(i => i.trim()).map(i => i.trim()),
        form_fields: selectedService.form_fields || [],
        is_active: selectedService.is_active,
      };

      await api.put(`/services/${selectedService.id}`, updateData);
      Alert.alert('Éxito', 'Servicio actualizado correctamente');
      setEditModalVisible(false);
      loadServices();
    } catch (error) {
      console.error('Error updating service:', error);
      Alert.alert('Error', 'No se pudo actualizar el servicio');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service: CustomService) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Estás seguro de que deseas eliminar "${service.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/services/${service.id}`);
              Alert.alert('Éxito', 'Servicio eliminado');
              loadServices();
            } catch (error) {
              console.error('Error deleting service:', error);
              Alert.alert('Error', 'No se pudo eliminar el servicio');
            }
          },
        },
      ]
    );
  };

  if (!user || user.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Acceso denegado</Text>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.gold} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Gestión de Servicios</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {services.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="briefcase-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>No hay servicios registrados</Text>
          </View>
        ) : (
          services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                {!service.is_active && (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>Inactivo</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {service.description}
              </Text>
              
              <View style={styles.servicePriceRow}>
                <Text style={styles.servicePrice}>€{service.price}</Text>
                {service.is_offer && service.original_price && (
                  <Text style={styles.serviceOriginalPrice}>€{service.original_price}</Text>
                )}
              </View>

              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => openEditModal(service)}
                >
                  <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
                  <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(service)}
                >
                  <MaterialCommunityIcons name="trash-can" size={18} color={Colors.error} />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.container}>
          <LinearGradient colors={Gradients.gold} style={styles.header}>
            <SafeAreaView edges={['top']}>
              <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => setEditModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Editar Servicio</Text>
                <View style={{ width: 40 }} />
              </View>
            </SafeAreaView>
          </LinearGradient>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.modalContent}>
              <Text style={styles.label}>Título del Servicio</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Análisis BaZi Personalizado"
                placeholderTextColor={Colors.textLight}
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe el servicio en detalle..."
                placeholderTextColor={Colors.textLight}
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Precio (€)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="99.99"
                placeholderTextColor={Colors.textLight}
                keyboardType="decimal-pad"
              />

              <View style={styles.checkboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setIsOffer(!isOffer)}
                >
                  <MaterialCommunityIcons
                    name={isOffer ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={isOffer ? Colors.accent : Colors.textLight}
                  />
                  <Text style={styles.checkboxLabel}>Es una oferta</Text>
                </TouchableOpacity>
              </View>

              {isOffer && (
                <>
                  <Text style={styles.label}>Precio Original (€)</Text>
                  <TextInput
                    style={styles.input}
                    value={originalPrice}
                    onChangeText={setOriginalPrice}
                    placeholder="150.00"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="decimal-pad"
                  />
                </>
              )}

              <Text style={styles.label}>¿Qué incluye? (una por línea)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={includes}
                onChangeText={setIncludes}
                placeholder="Análisis de 4 pilares&#10;Ciclos de suerte&#10;Informe PDF detallado"
                placeholderTextColor={Colors.textLight}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="content-save" size={20} color={Colors.primary} />
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: Spacing.xl * 2 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  header: {
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textLight,
    marginTop: Spacing.md,
  },
  serviceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  serviceTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    flex: 1,
  },
  inactiveBadge: {
    backgroundColor: Colors.textLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  inactiveText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  serviceDescription: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  servicePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  servicePrice: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.accent,
  },
  serviceOriginalPrice: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.sm,
    color: Colors.textLight,
    textDecorationLine: 'line-through',
  },
  serviceActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    flex: 1,
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  editButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  deleteButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.error,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  label: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  checkboxRow: {
    marginTop: Spacing.md,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkboxLabel: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
});
