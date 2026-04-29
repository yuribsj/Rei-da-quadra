import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login:          undefined;
  SignUp:         undefined;
  ForgotPassword: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

export function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"          component={require('./auth/LoginScreen').default} />
      <AuthStack.Screen name="SignUp"         component={require('./auth/SignUpScreen').default} />
      <AuthStack.Screen name="ForgotPassword" component={require('./auth/ForgotPasswordScreen').default} />
    </AuthStack.Navigator>
  );
}

// ─── Home Stack ───────────────────────────────────────────────────────────────

export type HomeStackParamList = {
  HomeList:             undefined;
  ChampionshipDetail:   { id: string; name: string; _t?: number };
  CreateChampionship:   undefined;
  EditChampionship:     { id: string; currentName: string };
  InvitePlayer:         { championshipId: string; championshipName: string; existingMemberIds: string[] };
  JoinChampionship:     undefined;
  RegisterResult:       { matchId: string; championshipId: string; pair1Names: [string, string]; pair2Names: [string, string]; pair1Nicknames?: [string | null, string | null]; pair2Nicknames?: [string | null, string | null]; pair1Avatars?: [string | null, string | null]; pair2Avatars?: [string | null, string | null]; existingResultId?: string; existingSets?: [number, number][]; isAdmin?: boolean };
  MatchDetail:          { matchId: string; championshipId: string };
  ChampionReveal:       { championshipId: string; championshipName: string };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeList"           component={require('./tabs/HomeScreen').default} />
      <HomeStack.Screen name="ChampionshipDetail" component={require('./championships/ChampionshipDetailScreen').default} />
      <HomeStack.Screen name="EditChampionship"    component={require('./championships/EditChampionshipScreen').default} options={{ presentation: 'modal' }} />
      <HomeStack.Screen name="InvitePlayer"       component={require('./championships/InvitePlayerScreen').default} options={{ presentation: 'modal' }} />
      <HomeStack.Screen name="CreateChampionship" component={require('./championships/CreateChampionshipScreen').default} options={{ presentation: 'modal' }} />
      <HomeStack.Screen name="JoinChampionship"   component={require('./championships/JoinChampionshipScreen').default} options={{ presentation: 'modal' }} />
      <HomeStack.Screen name="RegisterResult"     component={require('./championships/RegisterResultScreen').default} />
      <HomeStack.Screen name="MatchDetail"        component={require('./championships/MatchDetailScreen').default} />
      <HomeStack.Screen name="ChampionReveal"     component={require('./championships/ChampionRevealScreen').default} />
    </HomeStack.Navigator>
  );
}

// ─── Profile Stack ────────────────────────────────────────────────────────────

export type ProfileStackParamList = {
  ProfileMain:    undefined;
  EditProfile:    undefined;
  CareerHistory:  undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain"   component={require('./tabs/ProfileScreen').default} />
      <ProfileStack.Screen name="EditProfile"   component={require('./tabs/EditProfileScreen').default} options={{ presentation: 'modal' }} />
      <ProfileStack.Screen name="CareerHistory" component={require('./tabs/CareerHistoryScreen').default} />
    </ProfileStack.Navigator>
  );
}

// ─── App Tabs ─────────────────────────────────────────────────────────────────

export type AppTabParamList = {
  Home:      undefined;
  MyMatches: undefined;
  Profile:   undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const TAB_ICONS: Record<string, string> = {
  Home:      '🏠',
  MyMatches: '🎾',
  Profile:   '👤',
};

const TAB_LABEL_KEYS: Record<string, string> = {
  Home:      'tabs.home',
  MyMatches: 'tabs.matches',
  Profile:   'tabs.profile',
};

export function AppNavigator() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarLabel: t(TAB_LABEL_KEYS[route.name]),
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor:  colors.border,
          borderTopWidth:  1,
          height:          72,
          paddingBottom:   12,
          paddingTop:      8,
        },
        tabBarActiveTintColor:   colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Home"      component={HomeStackNavigator} />
      <Tab.Screen name="MyMatches" component={require('./tabs/MyMatchesScreen').default} />
      <Tab.Screen name="Profile"   component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}
