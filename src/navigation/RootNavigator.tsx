import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';

import { useTheme } from '../theme/ThemeContext';
import { useStore } from '../store/store';

import { HomeScreen } from '../screens/HomeScreen';
import { QRScreen } from '../screens/QRScreen';
import { TransferScreen } from '../screens/TransferScreen';
import { AIScreen } from '../screens/AIScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { ScannerScreen } from '../screens/ScannerScreen';
import { QRCardDetailScreen } from '../screens/QRCardDetailScreen';
import { CreateQRScreen } from '../screens/CreateQRScreen';
import { LinkVaultScreen } from '../screens/LinkVaultScreen';
import { FileOrganizerScreen } from '../screens/FileOrganizerScreen';
import { MeetingScreen } from '../screens/MeetingScreen';
import { TranslationScreen } from '../screens/TranslationScreen';
import { TransferSessionScreen } from '../screens/TransferSessionScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AllQRCardsScreen } from '../screens/AllQRCardsScreen';
import { QRTemplateGalleryScreen } from '../screens/QRTemplateGalleryScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { useAuth } from '../auth/AuthProvider';

export type RootStackParamList = {
  Login: undefined;
  Tabs: undefined;
  Scanner: undefined;
  QRCardDetail: { id: string };
  CreateQR: { kind?: any } | undefined;
  LinkVault: undefined;
  FileOrganizer: undefined;
  Meeting: { id?: string } | undefined;
  Translation: undefined;
  TransferSession: { mode: 'send' | 'receive'; recordId?: string } | undefined;
  Settings: undefined;
  Notifications: undefined;
  AllQRCards: undefined;
  QRTemplateGallery: undefined;
};

export type TabParamList = {
  Home: undefined;
  QR: undefined;
  Transfer: undefined;
  AI: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const TabIcon = ({ name, color, focused }: { name: any; color: string; focused: boolean }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={focused ? name : (`${name}-outline` as any)} size={22} color={color} />
  </View>
);

const TabBarBadge = ({ count }: { count: number }) => {
  const { theme } = useTheme();
  if (count === 0) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: -4,
        right: -10,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: theme.colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: theme.colors.backgroundElevated,
      }}
    >
      <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
};

const TabsNavigator = () => {
  const { theme } = useTheme();
  const unread = useStore(s => s.notifications.filter(n => !n.read).length);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 18,
          height: 68,
          paddingTop: 8,
          paddingBottom: 8,
          borderRadius: 32,
          backgroundColor: theme.mode === 'dark' ? 'rgba(20,20,30,0.85)' : 'rgba(255,255,255,0.85)',
          borderTopWidth: 0,
          elevation: 16,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: theme.colors.border,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            tint={theme.mode === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          let iconName: any = 'home';
          if (route.name === 'Home') iconName = 'grid';
          else if (route.name === 'QR') iconName = 'qr-code';
          else if (route.name === 'Transfer') iconName = 'swap-horizontal';
          else if (route.name === 'AI') iconName = 'sparkles';
          else if (route.name === 'Profile') iconName = 'person';
          return (
            <View>
              <TabIcon name={iconName} color={color} focused={focused} />
              {route.name === 'Profile' && <TabBarBadge count={unread} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
      <Tab.Screen name="QR" component={QRScreen} options={{ tabBarLabel: 'QR' }} />
      <Tab.Screen name="Transfer" component={TransferScreen} options={{ tabBarLabel: 'Transfer' }} />
      <Tab.Screen name="AI" component={AIScreen} options={{ tabBarLabel: 'AI' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
    </Tab.Navigator>
  );
};

export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();
  const { session, loading } = useAuth();

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  const navTheme = theme.mode === 'dark'
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: theme.colors.background,
          card: theme.colors.background,
          border: 'transparent',
          primary: theme.colors.primary,
          text: theme.colors.text,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: theme.colors.background,
          card: theme.colors.background,
          border: 'transparent',
          primary: theme.colors.primary,
          text: theme.colors.text,
        },
      };

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        key={session ? 'authenticated' : 'unauthenticated'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        {session ? (
          <>
        <Stack.Screen name="Tabs" component={TabsNavigator} />
        <Stack.Screen name="Scanner" component={ScannerScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="QRCardDetail" component={QRCardDetailScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="CreateQR" component={CreateQRScreen} options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="LinkVault" component={LinkVaultScreen} />
        <Stack.Screen name="FileOrganizer" component={FileOrganizerScreen} />
        <Stack.Screen name="Meeting" component={MeetingScreen} />
        <Stack.Screen name="Translation" component={TranslationScreen} />
        <Stack.Screen name="TransferSession" component={TransferSessionScreen} options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="AllQRCards" component={AllQRCardsScreen} />
        <Stack.Screen name="QRTemplateGallery" component={QRTemplateGalleryScreen} />
          </>
        ) : (
          <Stack.Screen name="Login" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
