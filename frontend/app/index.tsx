import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Gradients } from '@/src/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/context/AuthContext';

export default function Index() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // Go directly to home - no login required
      router.replace('/(tabs)/home');
    }
  }, [loading]);

  return (
    <LinearGradient
      colors={Gradients.navy}
      style={styles.container}
    >
      <ActivityIndicator size="large" color={Colors.accent} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
