import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, SafeAreaView, Platform,
} from 'react-native';
import { RouterProvider, useRouter } from './src/context/RouterContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import UploadScreen from './src/screens/main/UploadScreen';
import ReceiptDetailScreen from './src/screens/main/ReceiptDetailScreen';
import InsightsScreen from './src/screens/main/InsightsScreen';

const TABS = [
  { screen: 'Home', label: 'Fişlerim', icon: '🧾' },
  { screen: 'Upload', label: 'Ekle', icon: '📷' },
  { screen: 'Insights', label: 'Analizler', icon: '📊' },
];

function TabBar() {
  const { current, reset } = useRouter();
  const activeScreen = TABS.some(t => t.screen === current.screen)
    ? current.screen
    : 'Home';

  return (
    <View style={styles.tabBar}>
      {TABS.map(tab => {
        const active = activeScreen === tab.screen;
        return (
          <TouchableOpacity
            key={tab.screen}
            style={styles.tabItem}
            onPress={() => reset(tab.screen)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, active && styles.tabIconActive]}>
              {tab.icon}
            </Text>
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function Navigator() {
  const { user, loading } = useAuth();
  const { current, navigate, goBack, reset } = useRouter();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  const navigation = { navigate, goBack, reset };

  if (!user) {
    if (current.screen === 'Register') {
      return <RegisterScreen navigation={navigation} route={current} />;
    }
    return <LoginScreen navigation={navigation} route={current} />;
  }

  const isDetailScreen = current.screen === 'ReceiptDetail';

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.screenContainer}>
        {current.screen === 'ReceiptDetail' ? (
          <ReceiptDetailScreen navigation={navigation} route={current} />
        ) : current.screen === 'Upload' ? (
          <UploadScreen navigation={navigation} route={current} />
        ) : current.screen === 'Insights' ? (
          <InsightsScreen navigation={navigation} route={current} />
        ) : (
          <HomeScreen navigation={navigation} route={current} />
        )}
      </View>
      {!isDetailScreen && <TabBar />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <Navigator />
      </AuthProvider>
    </RouterProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  screenContainer: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 22, opacity: 0.35 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 4, fontWeight: '500' },
  tabLabelActive: { color: '#4F46E5', fontWeight: '700' },
});
