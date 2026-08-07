import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

interface UserData {
  id: string;
  email: string;
  name: string;
}

interface ReportData {
  id: string;
  user_id: string;
  report_content: string;
  is_published: boolean;
  created_at?: string;
  published_at?: string;
}

export default function AdminBaziReportsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [searchEmail, setSearchEmail] = useState('');
  const [user, setUser] = useState<UserData | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportData | null>(null);
  const [reportContent, setReportContent] = useState('');
  const [searchError, setSearchError] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Content delivery states
  const [videoUrl, setVideoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [webUrl, setWebUrl] = useState('');
  const [uploadingContent, setUploadingContent] = useState(false);
  const [userContentList, setUserContentList] = useState<any[]>([]);
  const [loadingContent, setLoadingContent] = useState(false);

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      Alert.alert('Error', 'Introduce un email');
      return;
    }

    setSearching(true);
    setSearchError('');
    setUser(null);
    setReports([]);
    setSelectedReport(null);
    setReportContent('');
    setIsCreatingNew(false);

    try {
      const response = await api.get(`/admin/bazi-reports/search?email=${encodeURIComponent(searchEmail.trim())}`);
      setUser(response.data.user);
      if (response.data.reports && response.data.reports.length > 0) {
        setReports(response.data.reports);
      }
      // Load user content
      loadUserContent(searchEmail.trim());
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchError(t('admin.user_not_found'));
      } else {
        setSearchError('Error al buscar usuario');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleSelectReport = (report: ReportData) => {
    setSelectedReport(report);
    setReportContent(report.report_content || '');
    setIsCreatingNew(false);
  };

  const handleNewReport = () => {
    setSelectedReport(null);
    setReportContent('');
    setIsCreatingNew(true);
  };

  const handleCancelEdit = () => {
    setSelectedReport(null);
    setReportContent('');
    setIsCreatingNew(false);
  };

  const handleSave = async (publish: boolean) => {
    if (!user) return;
    
    if (!reportContent.trim()) {
      Alert.alert('Error', 'El contenido del informe no puede estar vacío');
      return;
    }

    setSaving(true);
    try {
      if (selectedReport) {
        // Update existing report by report_id
        await api.put(`/admin/bazi-reports/${selectedReport.id}`, {
          report_content: reportContent.trim(),
          is_published: publish,
        });
      } else {
        // Create new report
        await api.post('/admin/bazi-reports', {
          user_email: user.email,
          report_content: reportContent.trim(),
          is_published: publish,
        });
      }
      
      Alert.alert('Éxito', publish ? t('admin.report_published') : t('admin.report_saved'));
      
      // Refresh data and reset form
      setSelectedReport(null);
      setReportContent('');
      setIsCreatingNew(false);
      handleSearch();
    } catch (error) {
      console.error('Error saving report:', error);
      Alert.alert('Error', 'No se pudo guardar el informe');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
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

  const uploadImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    
    formData.append('user_email', user.email);
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
      loadUserContent(user.email);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo subir la imagen');
    } finally {
      setUploadingContent(false);
    }
  };

  const uploadPDF = async () => {
    if (!user) return;

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    const formData = new FormData();
    
    formData.append('user_email', user.email);
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
      loadUserContent(user.email);
    } catch (error: any) {
      console.error('Error uploading PDF:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo subir el PDF');
    } finally {
      setUploadingContent(false);
    }
  };

  const submitVideoUrl = async () => {
    if (!user || !videoUrl.trim()) {
      Alert.alert('Error', 'Ingresa una URL de video');
      return;
    }

    const formData = new FormData();
    formData.append('user_email', user.email);
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
      loadUserContent(user.email);
    } catch (error: any) {
      console.error('Error submitting video URL:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar el enlace');
    } finally {
      setUploadingContent(false);
    }
  };

  const submitPdfUrl = async () => {
    if (!user || !pdfUrl.trim()) {
      Alert.alert('Error', 'Ingresa una URL de PDF');
      return;
    }

    const formData = new FormData();
    formData.append('user_email', user.email);
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
      loadUserContent(user.email);
    } catch (error: any) {
      console.error('Error submitting PDF URL:', error);
      Alert.alert('Error', error.response?.data?.detail || 'No se pudo guardar el enlace');
    } finally {
      setUploadingContent(false);
    }
  };

  const submitWebUrl = async () => {
    if (!user || !webUrl.trim()) {
      Alert.alert('Error', 'Ingresa una URL web');
      return;
    }

    const formData = new FormData();
    formData.append('user_email', user.email);
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
      loadUserContent(user.email);
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
              if (user) {
                loadUserContent(user.email);
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

  const renderReportItem = ({ item, index }: { item: ReportData; index: number }) => (
    <TouchableOpacity 
      style={[
        styles.reportItem,
        selectedReport?.id === item.id && styles.reportItemSelected
      ]}
      onPress={() => handleSelectReport(item)}
    >
      <View style={styles.reportItemHeader}>
        <Text style={styles.reportItemTitle}>Informe #{index + 1}</Text>
        {item.is_published ? (
          <View style={styles.publishedBadge}>
            <MaterialCommunityIcons name="check-circle" size={14} color="#FFFFFF" />
            <Text style={styles.publishedText}>Publicado</Text>
          </View>
        ) : (
          <View style={styles.draftBadge}>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.accent} />
            <Text style={styles.draftText}>Borrador</Text>
          </View>
        )}
      </View>
      <Text style={styles.reportItemDate}>
        Creado: {formatDate(item.created_at)}
      </Text>
      <Text style={styles.reportItemPreview} numberOfLines={2}>
        {item.report_content}
      </Text>
    </TouchableOpacity>
  );

  const showEditor = isCreatingNew || selectedReport;

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.gold} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('admin.bazi_reports')}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <>
              {/* Search Section */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('admin.search_user')}</Text>
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
                
                {searchError ? (
                  <Text style={styles.errorText}>{searchError}</Text>
                ) : null}
              </View>

              {/* User Found */}
              {user && (
                <>
                  <View style={styles.userCard}>
                    <MaterialCommunityIcons name="account-circle" size={40} color={Colors.accent} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.name || 'Sin nombre'}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </View>

                  {/* Reports List */}
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>
                        Informes ({reports.length})
                      </Text>
                      {!showEditor && (
                        <TouchableOpacity 
                          style={styles.newReportButton}
                          onPress={handleNewReport}
                        >
                          <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                          <Text style={styles.newReportButtonText}>Nuevo</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {reports.length === 0 && !showEditor && (
                      <Text style={styles.emptyText}>
                        Este usuario no tiene informes. Crea uno nuevo.
                      </Text>
                    )}

                    {reports.length > 0 && !showEditor && (
                      <FlatList
                        data={reports}
                        renderItem={renderReportItem}
                        keyExtractor={(item) => item.id}
                        scrollEnabled={false}
                        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
                      />
                    )}
                  </View>

                  {/* Report Editor */}
                  {showEditor && (
                    <View style={styles.editorCard}>
                      <View style={styles.editorHeader}>
                        <Text style={styles.label}>
                          {selectedReport ? `Editando Informe` : 'Nuevo Informe'}
                        </Text>
                        <TouchableOpacity onPress={handleCancelEdit}>
                          <MaterialCommunityIcons name="close" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                      </View>
                      <TextInput
                        style={styles.textArea}
                        value={reportContent}
                        onChangeText={setReportContent}
                        placeholder="Escribe aquí el análisis personalizado de la Carta Natal BaZi del usuario...

Incluye:
• Análisis de los 4 Pilares del Destino
• Elemento del Día Maestro
• Ciclos de Suerte
• Elementos favorables y desfavorables
• Recomendaciones personalizadas"
                        placeholderTextColor={Colors.textLight}
                        multiline
                        textAlignVertical="top"
                      />

                      {/* Action Buttons */}
                      <View style={styles.buttonRow}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.draftButton]}
                          onPress={() => handleSave(false)}
                          disabled={saving}
                        >
                          {saving ? (
                            <ActivityIndicator color={Colors.primary} size="small" />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="content-save-outline" size={20} color={Colors.primary} />
                              <Text style={styles.draftButtonText}>{t('admin.save_draft')}</Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionButton, styles.publishButton]}
                          onPress={() => handleSave(true)}
                          disabled={saving}
                        >
                          {saving ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                          ) : (
                            <>
                              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
                              <Text style={styles.publishButtonText}>{t('admin.publish_report')}</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Content Delivery Section */}
                  {!showEditor && (
                    <>
                      {/* Existing Content List */}
                      {loadingContent ? (
                        <View style={styles.loadingContentContainer}>
                          <ActivityIndicator color={Colors.accent} size="small" />
                          <Text style={styles.loadingContentText}>Cargando contenido...</Text>
                        </View>
                      ) : userContentList.length > 0 && (
                        <View style={styles.card}>
                          <Text style={styles.sectionTitle}>
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

                      {/* Content Delivery Actions */}
                      <View style={styles.card}>
                        <Text style={styles.sectionTitle}>Entrega de Contenidos</Text>
                        
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
                    </>
                  )}
                </>
              )}

              <View style={{ height: Spacing.xl * 2 }} />
            </>
          }
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  newReportButton: {
    backgroundColor: Colors.jade,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  newReportButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: '#FFFFFF',
  },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  searchRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
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
  errorText: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
  userCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.accent + '40',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  // Report list items
  reportItem: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
  },
  reportItemSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  reportItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  reportItemTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  reportItemDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  reportItemPreview: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: Typography.sm * 1.4,
  },
  publishedBadge: {
    backgroundColor: Colors.jade,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  publishedText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: '#FFFFFF',
  },
  draftBadge: {
    backgroundColor: Colors.accent + '20',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  draftText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.xs,
    color: Colors.accent,
  },
  // Editor
  editorCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  label: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  textArea: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  draftButton: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  draftButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: Colors.primary,
  },
  publishButton: {
    backgroundColor: Colors.jade,
  },
  publishButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.sm,
    color: '#FFFFFF',
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
});
