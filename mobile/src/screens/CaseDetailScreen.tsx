import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

export default function CaseDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { id } = route.params as { id: string };
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const response = await api.get(`/cases/${id}`);
      return response.data.case;
    },
  });

  const closeCaseMutation = useMutation({
    mutationFn: async (notes: string) => {
      const formData = new FormData();
      formData.append('closureNotes', notes);
      const response = await api.post(`/cases/${id}/close`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Case closed successfully!');
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      setShowCloseModal(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to close case');
    },
  });

  const handleCloseCase = () => {
    if (!closureNotes.trim()) {
      Alert.alert('Error', 'Closure notes are required');
      return;
    }
    closeCaseMutation.mutate(closureNotes);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text>Case not found</Text>
      </View>
    );
  }

  const canClose = (user?.role === 'ADMIN' || user?.role === 'WORKER') && data.status === 'OPEN';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleLarge">{data.type}</Text>
            <Text
              variant="bodySmall"
              style={[
                styles.status,
                data.status === 'OPEN' ? styles.statusOpen : styles.statusClosed,
              ]}
            >
              {data.status}
            </Text>
          </View>

          <Text variant="bodyMedium" style={styles.location}>
            {data.zone?.name} - {data.road?.name}
          </Text>

          <Text variant="bodySmall" style={styles.date}>
            Created: {format(new Date(data.createdAt), 'PPpp')}
          </Text>

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {data.description}
          </Text>

          {data.plannedWork && (
            <>
              <Text variant="bodyMedium" style={styles.sectionTitle}>
                Planned Work
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                {data.plannedWork}
              </Text>
            </>
          )}

          {data.photos && data.photos.length > 0 && (
            <>
              <Text variant="bodyMedium" style={styles.sectionTitle}>
                Photos
              </Text>
              <View style={styles.photosContainer}>
                {data.photos.map((photo: any) => (
                  <Image
                    key={photo.id}
                    source={{ uri: `http://localhost:3001/uploads/cases/${photo.filename}` }}
                    style={styles.photo}
                  />
                ))}
              </View>
            </>
          )}

          {data.status === 'CLOSED' && (
            <>
              <Text variant="bodyMedium" style={styles.sectionTitle}>
                Closure Notes
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                {data.closureNotes}
              </Text>
            </>
          )}

          {canClose && (
            <Button
              mode="contained"
              onPress={() => setShowCloseModal(true)}
              style={styles.closeButton}
            >
              Close Case
            </Button>
          )}
        </Card.Content>
      </Card>

      {showCloseModal && (
        <Card style={styles.modalCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Close Case
            </Text>
            <TextInput
              label="Closure Notes *"
              value={closureNotes}
              onChangeText={setClosureNotes}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <Button
                mode="contained"
                onPress={handleCloseCase}
                loading={closeCaseMutation.isPending}
                style={styles.modalButton}
              >
                Close Case
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowCloseModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
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
  card: {
    margin: 16,
    elevation: 4,
  },
  header: {
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
    marginBottom: 16,
    color: '#94a3b8',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  description: {
    color: '#374151',
    lineHeight: 20,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  closeButton: {
    marginTop: 24,
  },
  modalCard: {
    margin: 16,
    elevation: 8,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
});
