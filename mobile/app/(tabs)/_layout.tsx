import { Tabs } from 'expo-router';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

const COLORS = {
  bg: '#36333a',
  primary: '#b1b7a2',
  text: '#f5f5f5',
  textMuted: 'rgba(245,245,245,0.5)',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.bg, borderBottomColor: 'rgba(255,255,255,0.05)' },
        headerTintColor: COLORS.text,
        tabBarStyle: { backgroundColor: COLORS.bg, borderTopColor: 'rgba(255,255,255,0.05)' },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        headerTitle: () => (
          <View style={styles.headerLeft}>
            <View style={styles.logoPlaceholder} />
            <Text style={styles.logoText}>HappyPause</Text>
          </View>
        ),
        headerRight: () => (
          <Link href="/settings" asChild>
            <TouchableOpacity style={styles.settingsBtn}>
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
          </Link>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarLabel: 'Timer',
          tabBarIcon: () => <Text style={styles.tabIcon}>⏱</Text>,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarLabel: 'Stats',
          tabBarIcon: () => <Text style={styles.tabIcon}>📊</Text>,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
          tabBarIcon: () => <Text style={styles.tabIcon}>📜</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: () => <Text style={styles.tabIcon}>👤</Text>,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoPlaceholder: { width: 32, height: 32, backgroundColor: COLORS.primary, borderRadius: 6 },
  logoText: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: COLORS.text },
  settingsBtn: { padding: 8 },
  settingsIcon: { fontSize: 22, color: COLORS.textMuted },
  tabIcon: { fontSize: 20 },
});
