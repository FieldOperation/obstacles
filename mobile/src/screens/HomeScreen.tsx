import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, FAB } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.greeting}>
            Welcome, {user?.name}
          </Text>
          <Text variant="bodyMedium" style={styles.role}>
            {user?.role}
          </Text>
        </View>

        <View style={styles.actions}>
          <Card style={styles.card} onPress={() => navigation.navigate('CasesList' as never)}>
            <Card.Content>
              <Text variant="titleLarge">View Cases</Text>
              <Text variant="bodyMedium" style={styles.cardDescription}>
                Browse all obstacles and damages
              </Text>
            </Card.Content>
          </Card>

          {(user?.role === 'ADMIN' || user?.role === 'WORKER') && (
            <Card
              style={styles.card}
              onPress={() => navigation.navigate('CreateCase' as never)}
            >
              <Card.Content>
                <Text variant="titleLarge">Create Case</Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  Report a new obstacle or damage
                </Text>
              </Card.Content>
            </Card>
          )}

          <Button mode="outlined" onPress={logout} style={styles.logoutButton}>
            Logout
          </Button>
        </View>
      </ScrollView>

      {(user?.role === 'ADMIN' || user?.role === 'WORKER') && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateCase' as never)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#0ea5e9',
  },
  greeting: {
    color: '#fff',
    fontWeight: 'bold',
  },
  role: {
    color: '#e0f2fe',
    marginTop: 4,
  },
  actions: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  cardDescription: {
    color: '#64748b',
    marginTop: 4,
  },
  logoutButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#0ea5e9',
  },
});
