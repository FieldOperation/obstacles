import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { MD3LightTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { AuthProvider } from './src/contexts/AuthContext';
import { RealtimeProvider } from './src/contexts/RealtimeContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateCaseScreen from './src/screens/CreateCaseScreen';
import CaseDetailScreen from './src/screens/CaseDetailScreen';
import CasesListScreen from './src/screens/CasesListScreen';
import { useAuth } from './src/contexts/AuthContext';
import { colors, radii } from './src/theme/tokens';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>Something went wrong</Text>
          <Text style={{ fontSize: 12, color: 'red' }}>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const queryClient = new QueryClient();

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: '#e0f2fe',
    secondary: colors.primary,
    outline: colors.border,
    surface: colors.surface,
    background: colors.bg,
  },
  roundness: radii.md,
};

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: colors.bg },
          cardStyleInterpolator: ({ current }) => ({
            cardStyle: { opacity: current.progress },
          }),
        }}
      >
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="CasesList" component={CasesListScreen} />
            <Stack.Screen name="CreateCase" component={CreateCaseScreen} />
            <Stack.Screen name="CaseDetail" component={CaseDetailScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.flex}>
          <PaperProvider theme={paperTheme}>
            <ThemeProvider>
              <AuthProvider>
                <RealtimeProvider>
                  <BottomSheetModalProvider>
                    <StatusBar style="auto" />
                    <AppNavigator />
                  </BottomSheetModalProvider>
                </RealtimeProvider>
              </AuthProvider>
            </ThemeProvider>
          </PaperProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
