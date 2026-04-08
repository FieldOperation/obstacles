import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import { Card, Text, Button, ActivityIndicator, TextInput } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { casesService, settingsService } from '../services/supabaseService';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AppHeader, StatusChip } from '../components';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { formatCaseNumber } from '../lib/caseNumber';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';

export default function CaseDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { id } = route.params as { id: string };
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closureNotes, setClosureNotes] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });
  const logos = settings?.contractorLogoUrl || settings?.ownerLogoUrl
    ? { contractor: settings.contractorLogoUrl || undefined, owner: settings.ownerLogoUrl || undefined }
    : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['case', id],
    queryFn: async () => {
      const { case: c } = await casesService.getById(id);
      return c;
    },
  });

  const closeCaseMutation = useMutation({
    mutationFn: async (notes: string) => {
      const { case: c } = await casesService.close(id, notes, []);
      return c;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Case closed successfully!');
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowCloseModal(false);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to close case');
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
      <View style={styles.container}>
        <AppHeader title="Case" leftAction={{ onPress: () => navigation.goBack() }} logos={logos} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <AppHeader title="Case" leftAction={{ onPress: () => navigation.goBack() }} logos={logos} />
        <View style={styles.center}>
          <Text style={styles.notFound}>Case not found</Text>
        </View>
      </View>
    );
  }

  const canClose = (user?.role === 'ADMIN' || user?.role === 'WORKER') && data.status === 'OPEN';

  return (
    <View style={styles.container}>
      <AppHeader
        title={formatCaseNumber(data.case_number ?? data.caseNumber, data.id)}
        subtitle={data.type}
        leftAction={{ onPress: () => navigation.goBack() }}
        logos={logos}
      />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text style={styles.typeTitle}>{data.type}</Text>
            <StatusChip status={data.status} />
          </View>

          <Text variant="bodyMedium" style={styles.caseId}>
            {formatCaseNumber(data.case_number ?? data.caseNumber, data.id)}
          </Text>

          <Text variant="bodyMedium" style={styles.location}>
            {data.zones?.name || data.zone?.name} - {data.roads?.name || data.road?.name}
          </Text>

          <Text variant="bodySmall" style={styles.date}>
            Created: {format(new Date(data.created_at || data.createdAt), 'PPpp')}
          </Text>

          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Description
          </Text>
          <Text variant="bodyMedium" style={styles.description}>
            {data.description}
          </Text>

          {(data.planned_work || data.plannedWork) && (
            <>
              <Text variant="bodyMedium" style={styles.sectionTitle}>
                Planned Work
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                {data.planned_work || data.plannedWork}
              </Text>
            </>
          )}

          {data.photos && data.photos.length > 0 && (
            <>
              <Text variant="bodyMedium" style={styles.sectionTitle}>
                Photos
              </Text>
              <View style={styles.photosContainer}>
                {data.photos.map((photo: any, index: number) => {
                  const uri = photo.url || photo.signedUrl;
                  if (!uri || typeof uri !== 'string') return null;
                  return (
                    <Image
                      key={photo.id || `photo-${index}`}
                      source={{ uri }}
                      style={styles.photo}
                      resizeMode="cover"
                    />
                  );
                })}
              </View>
            </>
          )}

          {data.status === 'CLOSED' && (
            <>
              <Text variant="bodyMedium" style={styles.sectionTitle}>
                Closure Notes
              </Text>
              <Text variant="bodyMedium" style={styles.description}>
                {data.closure_notes || data.closureNotes}
              </Text>
            </>
          )}

          {canClose && (
            <Button
              mode="contained"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowCloseModal(true);
              }}
              style={[styles.closeButton, shadows.button]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFound: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
  },
  card: {
    margin: spacing.md,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeTitle: {
    ...typography.titleLarge,
    color: colors.text,
  },
  caseId: {
    marginBottom: spacing.xs,
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.text,
  },
  location: {
    marginBottom: spacing.xs,
    ...typography.bodyMedium,
    color: colors.textSecondary,
  },
  date: {
    marginBottom: spacing.md,
    ...typography.caption,
    color: colors.textMuted,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    ...typography.titleSmall,
    color: colors.text,
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: radii.sm,
    backgroundColor: colors.borderLight,
  },
  closeButton: {
    marginTop: spacing.lg,
  },
  modalCard: {
    margin: spacing.md,
    borderRadius: radii.lg,
    overflow: 'hidden',
    ...shadows.modal,
  },
  modalTitle: {
    marginBottom: spacing.md,
    ...typography.titleMedium,
    color: colors.text,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
