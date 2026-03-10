import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { palette, shadow } from './src/theme';
import { AppProvider, useAppContext } from './src/context/AppContext';
import LimitModal from './src/components/LimitModal';
import UseItemConfirmModal from './src/components/UseItemConfirmModal';
import FarewellModal from './src/components/FarewellModal';
import MessageActionSheet from './src/components/MessageActionSheet';
import TodayScreen from './src/screens/TodayScreen';
import TalkScreen from './src/screens/TalkScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import PetDetailScreen from './src/screens/PetDetailScreen';
import WelcomeWizard from './src/screens/WelcomeWizard';

type RootStackParamList = {
  MainTabs: undefined;
  PetDetail: { petId?: string };
};

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  const insets = useSafeAreaInsets();
  const { state, dispatch, actions, totalUnreadCount } = useAppContext();
  const { pets, isHydrating, inventory, showLimitModal, farewellTarget, farewellStep, useItemConfirm, messageActionState } = state;

  if (isHydrating) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appViewport}>
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={styles.loadingText}>保存済みデータを読み込んでいます</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (pets.length === 0 && state.showWelcome) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.appViewport}>
          <WelcomeWizard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.appViewport}>
        <NavigationContainer>
          <LimitModal
            visible={showLimitModal}
            inventory={inventory}
            onUseItem={actions.handleUseItem}
            onClose={() => dispatch({ type: 'SET_SHOW_LIMIT_MODAL', value: false })}
          />
          <UseItemConfirmModal
            itemType={useItemConfirm}
            inventory={inventory}
            onConfirm={actions.confirmUseItem}
            onClose={() => dispatch({ type: 'SET_USE_ITEM_CONFIRM', itemType: null })}
          />
          <FarewellModal
            pet={farewellTarget}
            step={farewellStep}
            onNextStep={() => dispatch({ type: 'SET_FAREWELL_STEP', step: 2 })}
            onConfirm={() => void actions.confirmFarewell()}
            onClose={() => dispatch({ type: 'SET_FAREWELL_TARGET', pet: null })}
          />
          <MessageActionSheet
            visible={Boolean(messageActionState)}
            message={messageActionState?.message ?? null}
            petName={messageActionState ? (pets.find((p) => p.id === messageActionState.petId)?.name ?? '') : ''}
            petSpecies={messageActionState ? (pets.find((p) => p.id === messageActionState.petId)?.species ?? '') : ''}
            onClose={() => dispatch({ type: 'SET_MESSAGE_ACTION_STATE', state: null })}
            onReuse={() => {
              if (messageActionState) {
                dispatch({ type: 'SET_INPUT', value: messageActionState.message.text });
                dispatch({ type: 'SET_MESSAGE_ACTION_STATE', state: null });
              }
            }}
            onDelete={() => {
              if (messageActionState) {
                dispatch({ type: 'DELETE_MESSAGE', petId: messageActionState.petId, messageId: messageActionState.message.id });
                dispatch({ type: 'SET_MESSAGE_ACTION_STATE', state: null });
              }
            }}
          />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: palette.canvas },
              headerTintColor: palette.ink,
              headerShadowVisible: false,
              contentStyle: { backgroundColor: palette.canvas },
            }}
          >
            <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
              {() => (
                <Tab.Navigator
                  screenListeners={({ route }) => ({
                    focus: () => dispatch({ type: 'SET_ACTIVE_TAB', tab: route.name as 'Today' | 'Talk' | 'Settings' }),
                  })}
                  screenOptions={{
                    headerShown: false,
                    tabBarStyle: [styles.tabBar, { height: 68 + insets.bottom, paddingBottom: 8 + insets.bottom }],
                    tabBarActiveTintColor: palette.accent,
                    tabBarInactiveTintColor: palette.muted,
                    tabBarShowLabel: true,
                    tabBarLabelStyle: styles.tabLabel,
                    tabBarItemStyle: styles.tabItem,
                    tabBarIconStyle: styles.tabIconWrap,
                  }}
                >
                  <Tab.Screen
                    name="Today"
                    component={TodayScreen}
                    options={{
                      title: 'ホーム',
                      tabBarIcon: ({ color }) => <Feather name="sun" size={20} color={color} />,
                    }}
                  />
                  <Tab.Screen
                    name="Talk"
                    component={TalkScreen}
                    options={{
                      title: 'おはなし',
                      tabBarIcon: ({ color }) => <Feather name="message-circle" size={20} color={color} />,
                      tabBarBadge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
                      tabBarBadgeStyle: styles.tabBadge,
                    }}
                  />
                  <Tab.Screen
                    name="Settings"
                    component={SettingsScreen}
                    options={{
                      title: '設定',
                      tabBarIcon: ({ color }) => <Feather name="settings" size={20} color={color} />,
                    }}
                  />
                </Tab.Navigator>
              )}
            </Stack.Screen>
            <Stack.Screen
              name="PetDetail"
              component={PetDetailScreen}
              options={({ route }) => ({
                title: route.params?.petId ? 'ペット詳細' : '新しいペット',
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </SafeAreaView>
  );
}

function AppRoot() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.canvas,
    alignItems: 'center',
  },
  appViewport: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 430 : '100%',
    alignSelf: 'center',
    backgroundColor: palette.canvas,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    color: palette.text,
    fontSize: 14,
  },
  tabBar: {
    backgroundColor: palette.surface,
    borderTopWidth: 0,
    paddingTop: 6,
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    borderRadius: 20,
    ...shadow.lg,
  },
  tabItem: {
    borderRadius: 14,
    paddingHorizontal: 0,
  },
  tabIconWrap: {
    marginTop: 0,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBadge: {
    backgroundColor: palette.accent,
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default AppRoot;
