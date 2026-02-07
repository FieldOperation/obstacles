import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { SocketProvider } from './src/contexts/SocketContext';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CreateCaseScreen from './src/screens/CreateCaseScreen';
import CaseDetailScreen from './src/screens/CaseDetailScreen';
import CasesListScreen from './src/screens/CasesListScreen';
import { useAuth } from './src/contexts/AuthContext';

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

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading screen
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
        <PaperProvider>
          <AuthProvider>
            <SocketProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </SocketProvider>
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
