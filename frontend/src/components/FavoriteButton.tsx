import React, { useState, useEffect } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/Colors';
import { useAuth } from '@/src/context/AuthContext';
import api from '@/src/services/api';
import { useRouter } from 'expo-router';

interface FavoriteButtonProps {
  itemType: string; // 'daily_energy', 'newborn_vocation', 'agenda', 'concept'
  itemId: string;
  size?: number;
  color?: string;
  style?: any;
}

export default function FavoriteButton({ 
  itemType, 
  itemId, 
  size = 28, 
  color = Colors.accent,
  style 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, itemId]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await api.get('/favorites');
      const favorites = response.data;
      const exists = favorites.some(
        (fav: any) => fav.item_type === itemType && fav.item_id === itemId
      );
      setIsFavorite(exists);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const handleToggleFavorite = async () => {
    // Require login
    if (!user) {
      Alert.alert(
        'Iniciar sesión requerido',
        'Debes iniciar sesión para guardar favoritos',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar sesión', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        // Remove from favorites
        await api.delete(`/favorites/${itemType}/${itemId}`);
        setIsFavorite(false);
      } else {
        // Add to favorites
        await api.post('/favorites', {
          item_type: itemType,
          item_id: itemId
        });
        setIsFavorite(true);
      }
    } catch (error: any) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'No se pudo actualizar favoritos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleToggleFavorite}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <MaterialCommunityIcons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
          color={isFavorite ? Colors.error : color}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
