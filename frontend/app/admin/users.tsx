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
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

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
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  // Content delivery states
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [uploadingContent, setUploadingContent] = useState(false);
  const [userContentList, setUserContentList] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

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
    setNewPassword('');
    setEditModalVisible(true);
    loadUserContent(user.email);
  };

  const loadUserContent = async (email: string) => {
    setLoadingContent(true);
    try {
      const response = await api.get(`/admin/user-content?email=${encodeURIComponent(email)}`);
      setUserContentList(response.data.content || []);
    } catch (error) {
      console.error('Error loading user content:', error);
      setUserContentList([]);
    } finally {
      setLoadingContent(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const params: any = {
        role: selectedRole,
        subscription: selectedSubscription,
      };
      
      if (newPassword.trim()) {
        params.new_password = newPassword.trim();
      }

      await api.put(`/admin/users/${selectedUser.id}`, null, { params });
      
      Alert.alert('Éxito', 'Usuario actualizado correctamente');
      setEditModalVisible(false);
      setNewPassword('');
      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      Alert.alert('Error', 'No se pudo actualizar el usuario');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async () => {
    if (!selectedUser) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    
    formData.append('user_email', selectedUser.email);
    formData.append('type', 'image');
    formData.append('title', `Imagen - ${new Date().toLocaleDateString()}`);
    
    // @ts-ignore - React Native FormData handles this
    formData.append('file', {
      uri: asset.uri,
      name: asset.fileName || 'image.jpg',
      type: asset.mimeType || 'image/jpeg',
    });

    setUploadingContent(true);
    try {
      await api.post('/admin/user-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Éxito', 'Imagen subida correctamente');
      loadUserContent(selectedUser.email); // Reload list
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo subir la imagen');
    } finally {
      setUploadingContent(false);
    }
  };

  const uploadPDF = async () => {
    if (!selectedUser) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    
    formData.append('user_email', selectedUser.email);
    formData.append('type', 'pdf');
    formData.append('title', asset.name || `PDF - ${new Date().toLocaleDateString()}`);
    
    // @ts-ignore - React Native FormData handles this
    formData.append('file', {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || 'application/pdf',
    });

    setUploadingContent(true);
    try {
      await api.post('/admin/user-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Éxito', 'PDF subido correctamente');
      loadUserContent(selectedUser.email); // Reload list
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo subir el PDF');
    } finally {
      setUploadingContent(false);
    }
  };

  const submitVideoUrl = async () => {
    if (!selectedUser || !videoUrl.trim()) {
      Alert.alert('Error', 'Ingresa una URL de video');
      return;
    }

    const formData = new FormData();
    formData.append('user_email', selectedUser.email);
    formData.append('type', 'video');
    formData.append('title', `Video - ${new Date().toLocaleDateString()}`);
    formData.append('url', videoUrl.trim());

    setUploadingContent(true);
    try {
      await api.post('/admin/user-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Éxito', 'Enlace de video guardado');
      setVideoUrl('');
      loadUserContent(selectedUser.email); // Reload list
    } catch (error: any) {
      console.error('Error submitting video URL:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar el enlace');
    } finally {
      setUploadingContent(false);
    }
  };

  const submitPdfUrl = async () => {
    if (!selectedUser || !pdfUrl.trim()) {
      Alert.alert('Error', 'Ingresa una URL de PDF');
      return;
    }

    const formData = new FormData();
    formData.append('user_email', selectedUser.email);
    formData.append('type', 'pdf');
    formData.append('title', `PDF - ${new Date().toLocaleDateString()}`);
    formData.append('url', pdfUrl.trim());

    setUploadingContent(true);
    try {
      await api.post('/admin/user-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Éxito', 'Enlace de PDF guardado');
      setPdfUrl('');
      loadUserContent(selectedUser.email); // Reload list
    } catch (error: any) {
      console.error('Error submitting PDF URL:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar el enlace');
    } finally {
      setUploadingContent(false);
    }
  };

  const submitWebUrl = async () => {
    if (!selectedUser || !webUrl.trim()) {
      Alert.alert('Error', 'Ingresa una URL web');
      return;
    }

    const formData = new FormData();
    formData.append('user_email', selectedUser.email);
    formData.append('type', 'web');
    formData.append('title', `Enlace Web - ${new Date().toLocaleDateString()}`);
    formData.append('url', webUrl.trim());

    setUploadingContent(true);
    try {
      await api.post('/admin/user-content', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Éxito', 'Enlace web guardado');
      setWebUrl('');
      loadUserContent(selectedUser.email); // Reload list
    } catch (error: any) {
      console.error('Error submitting web URL:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar el enlace');
    } finally {
      setUploadingContent(false);
    }
  };

  const handleDeleteContent = (contentId: string, title: string) => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Eliminar "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/admin/user-content/${contentId}`);
              Alert.alert('Éxito', 'Contenido eliminado');
              if (selectedUser) {
                loadUserContent(selectedUser.email);
              }
            } catch (error: any) {
              console.error('Error deleting content:', error);
              Alert.alert('Error', error.response?.data?.detail || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
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

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'image': return 'image';
      case 'video': return 'video';
      case 'pdf': return 'file-pdf-box';
      case 'web': return 'web';
      default: return 'link';
    }
  };

  const getContentColor = (type: string) => {
    switch (type) {
      case 'image': return Colors.jade;
      case 'video': return Colors.error;
      case 'pdf': return Colors.accent;
      case 'web': return Colors.primary;
      default: return Colors.textLight;
    }
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

                  {/* New Password Field */}
                  <Text style={styles.modalLabel}>Nueva Contraseña (opcional)</Text>
                  <TextInput
                    style={styles.passwordInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Dejar vacío para no cambiar"
                    placeholderTextColor={Colors.textLight}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={styles.passwordHint}>
                    Solo completa este campo si deseas cambiar la contraseña del usuario
                  </Text>

                  {/* Existing Content List */}
                  {loadingContent ? (
                    <View style={styles.loadingContentContainer}>
                      <ActivityIndicator color={Colors.accent} size="small" />
                      <Text style={styles.loadingContentText}>Cargando contenido...</Text>
                    </View>
                  ) : userContentList.length > 0 && (
                    <View style={styles.existingContentSection}>
                      <Text style={styles.sectionHeader}>
                        Contenido Entregado ({userContentList.length})
                      </Text>
                      {userContentList.map((content) => (
                        <View key={content.id} style={styles.contentListItem}>
                          <View style={[
                            styles.contentListIcon,
                            { backgroundColor: getContentColor(content.type) + '20' }
                          ]}>
                            <MaterialCommunityIcons
                              name={getContentIcon(content.type)}
                              size={20}
                              color={getContentColor(content.type)}
                            />
                          </View>
                          <View style={styles.contentListInfo}>
                            <Text style={styles.contentListTitle} numberOfLines={1}>
                              {content.title}
                            </Text>
                            <Text style={styles.contentListDate}>
                              {formatDate(content.created_at)}
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.deleteContentButton}
                            onPress={() => handleDeleteContent(content.id, content.title)}
                          >
                            <MaterialCommunityIcons name="delete-outline" size={20} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Content Delivery Section */}
                  <View style={styles.contentDeliverySection}>
                    <Text style={styles.sectionHeader}>Entrega de Contenidos</Text>
                    
                    {/* Upload Image */}
                    <TouchableOpacity
                      style={styles.contentButton}
                      onPress={uploadImage}
                      disabled={uploadingContent}
                    >
                      <MaterialCommunityIcons name="image-plus" size={20} color={Colors.accent} />
                      <Text style={styles.contentButtonText}>Subir Imagen</Text>
                    </TouchableOpacity>

                    {/* Upload PDF */}
                    <TouchableOpacity
                      style={styles.contentButton}
                      onPress={uploadPDF}
                      disabled={uploadingContent}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={20} color={Colors.error} />
                      <Text style={styles.contentButtonText}>Subir PDF</Text>
                    </TouchableOpacity>

                    {/* Video URL */}
                    <View style={styles.urlInputContainer}>
                      <MaterialCommunityIcons name="video" size={20} color={Colors.jade} />
                      <TextInput
                        style={styles.urlInput}
                        value={videoUrl}
                        onChangeText={setVideoUrl}
                        placeholder="URL de video (YouTube, Vimeo, etc.)"
                        placeholderTextColor={Colors.textLight}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.urlSubmitButton}
                        onPress={submitVideoUrl}
                        disabled={uploadingContent || !videoUrl.trim()}
                      >
                        <MaterialCommunityIcons name="send" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>

                    {/* PDF URL */}
                    <View style={styles.urlInputContainer}>
                      <MaterialCommunityIcons name="link" size={20} color={Colors.error} />
                      <TextInput
                        style={styles.urlInput}
                        value={pdfUrl}
                        onChangeText={setPdfUrl}
                        placeholder="URL de PDF"
                        placeholderTextColor={Colors.textLight}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.urlSubmitButton}
                        onPress={submitPdfUrl}
                        disabled={uploadingContent || !pdfUrl.trim()}
                      >
                        <MaterialCommunityIcons name="send" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>

                    {/* Web URL */}
                    <View style={styles.urlInputContainer}>
                      <MaterialCommunityIcons name="web" size={20} color={Colors.accent} />
                      <TextInput
                        style={styles.urlInput}
                        value={webUrl}
                        onChangeText={setWebUrl}
                        placeholder="URL web"
                        placeholderTextColor={Colors.textLight}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity
                        style={styles.urlSubmitButton}
                        onPress={submitWebUrl}
                        disabled={uploadingContent || !webUrl.trim()}
                      >
                        <MaterialCommunityIcons name="send" size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>

                    {uploadingContent && (
                      <View style={styles.uploadingIndicator}>
                        <ActivityIndicator color={Colors.accent} size="small" />
                        <Text style={styles.uploadingText}>Procesando...</Text>
                      </View>
                    )}
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
  passwordInput: {
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
  passwordHint: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  contentDeliverySection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  sectionHeader: {
    fontFamily: Typography.serifBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  contentButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contentButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  urlInputContainer: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  urlInput: {
    flex: 1,
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  urlSubmitButton: {
    backgroundColor: Colors.accent,
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  uploadingText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  loadingContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  loadingContentText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  existingContentSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  contentListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  contentListIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  contentListInfo: {
    flex: 1,
  },
  contentListTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  contentListDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteContentButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.sm,
  },
});
