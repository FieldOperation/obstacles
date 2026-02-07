import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';

export default function CasesListScreen() {
  const navigation = useNavigation();

  const { data, isLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: async () => {
      const response = await api.get('/cases?limit=50');
      return response.data.cases;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const renderCase = ({ item }: { item: any }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('CaseDetail' as never, { id: item.id } as never)}
    >
      <Card.Content>
        <View style={styles.caseHeader}>
          <Text variant="titleMedium">{item.type}</Text>
          <Text
            variant="bodySmall"
            style={[
              styles.status,
              item.status === 'OPEN' ? styles.statusOpen : styles.statusClosed,
            ]}
          >
            {item.status}
          </Text>
        </View>
        <Text variant="bodyMedium" style={styles.location}>
          {item.zone?.name} - {item.road?.name}
        </Text>
        <Text variant="bodySmall" style={styles.date}>
          {format(new Date(item.createdAt), 'MMM dd, yyyy')}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderCase}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  statusOpen: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
  },
  statusClosed: {
    backgroundColor: '#d1fae5',
    color: '#059669',
  },
  location: {
    marginBottom: 4,
    color: '#64748b',
  },
  date: {
    color: '#94a3b8',
  },
});
