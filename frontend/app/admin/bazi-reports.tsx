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
});
