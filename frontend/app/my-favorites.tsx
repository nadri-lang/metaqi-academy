import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Gradients } from '@/src/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/src/constants/Typography';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/context/AuthContext';
import { useLanguage } from '@/src/context/LanguageContext';
import api from '@/src/services/api';

interface Favorite {
  id: string;
  user_id: string;
  item_type: string; // 'daily_energy', 'newborn_vocation', 'agenda', 'concept'
  item_id: string;
  created_at: string;
}

export default function MyFavoritesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      const response = await api.get('/favorites');
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const handleNavigate = (fav: Favorite) => {
    switch (fav.item_type) {
      case 'daily_energy':
        router.push('/energy-detail');
        break;
      case 'newborn_vocation':
        router.push('/newborn-vocation-detail');
        break;
      case 'agenda':
        router.push(`/agenda/${fav.item_id}`);
        break;
      case 'concept':
        router.push(`/concept/${fav.item_id}`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'daily_energy':
        return 'weather-sunny';
      case 'newborn_vocation':
        return 'star-outline';
      case 'agenda':
        return 'calendar';
      case 'concept':
        return 'book-open-variant';
      default:
        return 'heart';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'daily_energy':
        return language === 'es' ? 'Energía del Día' : 'Daily Energy';
      case 'newborn_vocation':
        return language === 'es' ? 'Vocación del Bebé' : 'Baby Vocation';
      case 'agenda':
        return language === 'es' ? 'Agenda' : 'Agenda';
      case 'concept':
        return language === 'es' ? 'Concepto' : 'Concept';
      default:
        return type;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.gold} style={styles.header}>
          <SafeAreaView edges={['top']}>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('profile.my_favorites')}</Text>
              <View style={{ width: 40 }} />
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="heart-outline" size={64} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>
            {language === 'es' ? 'Inicia sesión para ver tus favoritos' : 'Login to see your favorites'}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>{t('common.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
            <Text style={styles.headerTitle}>{t('profile.my_favorites')}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {favorites.length === 0 ? (
          <View style={styles.emptyStateInline}>
            <MaterialCommunityIcons name="heart-outline" size={64} color={Colors.textLight} />
            <Text style={styles.emptyTitle}>
              {language === 'es' ? 'No tienes favoritos aún' : 'No favorites yet'}
            </Text>
            <Text style={styles.emptyText}>
              {language === 'es' 
                ? 'Toca el ícono de corazón en cualquier contenido para guardarlo aquí' 
                : 'Tap the heart icon on any content to save it here'}
            </Text>
          </View>
        ) : (
          favorites.map((fav) => (
            <TouchableOpacity
              key={fav.id}
              style={styles.favoriteCard}
              onPress={() => handleNavigate(fav)}
            >
              <View style={styles.favoriteIcon}>
                <MaterialCommunityIcons name={getIcon(fav.item_type)} size={24} color={Colors.accent} />
              </View>
              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteType}>{getTypeLabel(fav.item_type)}</Text>
                <Text style={styles.favoriteId}>{fav.item_id}</Text>
                <Text style={styles.favoriteDate}>
                  {language === 'es' ? 'Guardado: ' : 'Saved: '}{formatDate(fav.created_at)}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textLight} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
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
    fontSize: Typography.xl,
    color: Colors.primary,
    textAlign: 'center',
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateInline: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontFamily: Typography.sans,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  loginButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  loginButtonText: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.primary,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteType: {
    fontFamily: Typography.sansSemiBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  favoriteId: {
    fontFamily: Typography.sans,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  favoriteDate: {
    fontFamily: Typography.sans,
    fontSize: Typography.xs,
    color: Colors.textLight,
    marginTop: 4,
  },
});
