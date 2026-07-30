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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  subscription: string;
  created_at?: string;
  phone?: string;
  nickname?: string;
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState('free');
  const [selectedSubscription, setSelectedSubscription] = useState('free');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      loadUsers();
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/admin/users?email=${encodeURIComponent(searchEmail.trim())}`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      Alert.alert('Error', 'No se pudo buscar el usuario');
    } finally {
      setSearching(false);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setSelectedRole(user.role || 'free');
    setSelectedSubscription(user.subscription || 'free');
    setEditModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, null, {
        params: {
          role: selectedRole,
          subscription: selectedSubscription,
        }
      });
      
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      setEditModalVisible(false);
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return Colors.error;
      case 'editor': return Colors.accent;
      case 'premium': return Colors.jade;
      default: return Colors.textLight;
    }
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    switch (subscription) {
      case 'yearly': return Colors.jade;
      case 'monthly': return Colors.accent;
      default: return Colors.textLight;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (!currentUser || currentUser.role !== 'admin') {
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
            <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Buscar por email</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchEmail}
              onChangeText={setSearchEmail}
              placeholder="usuario@email.com"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color={Colors.primary} size="small" />
              ) : (
                <MaterialCommunityIcons name="magnify" size={24} color={Colors.primary} />
              )}
            </TouchableOpacity>
          </View>
          {searchEmail.trim() && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchEmail('');
                loadUsers();
              }}
            >
              <Text style={styles.clearButtonText}>Ver todos</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Users List */}
        <Text style={styles.sectionTitle}>
          {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
        </Text>

        {users.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-group-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={styles.userIcon}>
                  <MaterialCommunityIcons name="account" size={24} color={Colors.accent} />
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name || 'Sin nombre'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  {user.created_at && (
                    <Text style={styles.userDate}>Registro: {formatDate(user.created_at)}</Text>
                  )}
                </View>
              </View>

              <View style={styles.badgesRow}>
                <View style={[styles.badge, { backgroundColor: getRoleBadgeColor(user.role) }]}>
                  <Text style={styles.badgeText}>{user.role.toUpperCase()}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getSubscriptionBadgeColor(user.subscription) }]}>
                  <Text style={styles.badgeText}>{user.subscription.toUpperCase()}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(user)}
              >
                <MaterialCommunityIcons name="pencil" size={18} color={Colors.primary} />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Editar Usuario</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {selectedUser && (
                <ScrollView contentContainerStyle={styles.modalContent}>
                  <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>

                  {/* Role Selection */}
                  <Text style={styles.modalLabel}>Rol</Text>
                  <View style={styles.optionsGrid}>
                    {['free', 'premium', 'editor', 'admin'].map((role) => (
                      <TouchableOpacity
                        key={role}
                        style={[
                          styles.optionButton,
                          selectedRole === role && styles.optionButtonSelected
                        ]}
                        onPress={() => setSelectedRole(role)}
                      >
                        <Text style={[
                          styles.optionText,
                          selectedRole === role && styles.optionTextSelected
                        ]}>
                          {role.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Subscription Selection */}
                  <Text style={styles.modalLabel}>Suscripción</Text>
                  <View style={styles.optionsGrid}>
                    {['free', 'monthly', 'yearly'].map((subscription) => (
                      <TouchableOpacity
                        key={subscription}
                        style={[
                          styles.optionButton,
                          selectedSubscription === subscription && styles.optionButtonSelected
                        ]}
                        onPress={() => setSelectedSubscription(subscription)}
                      >
                        <Text style={[
                          styles.optionText,
                          selectedSubscription === subscription && styles.optionTextSelected
                        ]}>
                          {subscription.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

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
                </ScrollView>
              )}
            </SafeAreaView>
          </View>
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
  searchCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  searchLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  searchButton: {
    backgroundColor: Colors.accent,
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
  },
  clearButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.accent,
  },
  sectionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
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
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  userDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    fontFamily: Typography.sansBold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  editButton: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  modalTitle: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
  },
  modalContent: {
    padding: Spacing.lg,
  },
  modalUserEmail: {
    fontFamily: Typography.sansMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalLabel: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  optionButtonSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  optionText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  optionTextSelected: {
    color: Colors.primary,
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
