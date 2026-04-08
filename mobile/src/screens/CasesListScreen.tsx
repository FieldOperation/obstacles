import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { casesService, zonesService, roadsService, settingsService } from '../services/supabaseService';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, CaseCard, EmptyState, CaseCardSkeleton } from '../components';
import { colors, spacing, typography, radii } from '../theme/tokens';

export interface CaseFilters {
  type: '' | 'OBSTACLE' | 'DAMAGE';
  status: '' | 'OPEN' | 'CLOSED';
  zoneId: string;
  roadId: string;
}

const defaultFilters: CaseFilters = {
  type: '',
  status: '',
  zoneId: '',
  roadId: '',
};

function hasActiveFilters(f: CaseFilters): boolean {
  return !!(f.type || f.status || f.zoneId || f.roadId);
}

export default function CasesListScreen() {
  const navigation = useNavigation();
  const filterSheetRef = useRef<React.ComponentRef<typeof BottomSheetModal>>(null);
  const [filters, setFilters] = useState<CaseFilters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<CaseFilters>(defaultFilters);
  const [roadSearch, setRoadSearch] = useState('');

  const { data: zonesData } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zonesService.getAll(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });

  const { data: roadsData } = useQuery({
    queryKey: ['roads', draftFilters.zoneId],
    queryFn: () => roadsService.getAll(draftFilters.zoneId),
    enabled: !!draftFilters.zoneId,
  });

  const zones = zonesData?.zones ?? [];
  const roads = roadsData?.roads ?? [];
  const filteredRoads = roads.filter((r) =>
    r.name?.toLowerCase().includes(roadSearch.trim().toLowerCase())
  );

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['cases', filters],
    queryFn: async () => {
      const filterObj: Record<string, string> = {};
      if (filters.type) filterObj.type = filters.type;
      if (filters.status) filterObj.status = filters.status;
      if (filters.zoneId) filterObj.zoneId = filters.zoneId;
      if (filters.roadId) filterObj.roadId = filters.roadId;
      const { cases } = await casesService.getAll(filterObj, 1, 50);
      return cases;
    },
  });


  useEffect(() => {
    if (!draftFilters.zoneId) {
      setDraftFilters((d) => ({ ...d, roadId: '' }));
    }
  }, [draftFilters.zoneId]);

  const cases = data ?? [];
  const isEmpty = !isLoading && !isError && cases.length === 0;

  const openFilter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDraftFilters(filters);
    setRoadSearch('');
    filterSheetRef.current?.present();
  }, [filters]);

  const applyFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters(draftFilters);
    filterSheetRef.current?.dismiss();
  }, [draftFilters]);

  const clearFilters = useCallback(() => {
    setDraftFilters(defaultFilters);
    setRoadSearch('');
    setFilters(defaultFilters);
    filterSheetRef.current?.dismiss();
  }, []);

  const renderCase = ({ item }: { item: any }) => {
    const zoneName = item.zones?.name ?? item.zone?.name ?? '';
    const roadName = item.roads?.name ?? item.road?.name ?? '';
    return (
      <CaseCard
        id={item.id}
        type={item.type}
        status={item.status}
        zoneName={zoneName}
        roadName={roadName}
        caseNumber={item.case_number ?? item.caseNumber}
        createdAt={item.created_at ?? item.createdAt}
        onPress={() => (navigation as any).navigate('CaseDetail', { id: item.id })}
      />
    );
  };

  const goBack = () => navigation.goBack();

  const logos =
    settings?.contractorLogoUrl || settings?.ownerLogoUrl
      ? { contractor: settings.contractorLogoUrl || undefined, owner: settings.ownerLogoUrl || undefined }
      : undefined;

  const activeCount = hasActiveFilters(filters)
    ? [filters.type, filters.status, filters.zoneId, filters.roadId].filter(Boolean).length
    : 0;

  if (isError) {
    return (
      <View style={styles.container}>
        <AppHeader title="Cases" subtitle="Error loading cases" leftAction={{ onPress: goBack }} logos={logos} />
        <View style={styles.center}>
          <EmptyState
            title="Couldn't load cases"
            message="Check your connection and try again."
            actionLabel="Retry"
            onAction={() => refetch()}
            icon="alert-circle-outline"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="Cases"
        subtitle={
          isEmpty
            ? undefined
            : `${cases.length} case${cases.length === 1 ? '' : 's'}${activeCount ? ' (filtered)' : ''}`
        }
        leftAction={{ onPress: goBack }}
        rightAction={{
          icon: 'filter',
          label: 'Filter cases',
          onPress: openFilter,
        }}
        logos={logos}
      />

      <BottomSheetModal
        ref={filterSheetRef}
        snapPoints={['75%']}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Cases</Text>
          <TouchableOpacity onPress={() => filterSheetRef.current?.dismiss()} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <BottomSheetScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Type</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !draftFilters.type && styles.chipActive]}
                  onPress={() => setDraftFilters((d) => ({ ...d, type: '' }))}
                >
                  <Text style={[styles.chipText, !draftFilters.type && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, draftFilters.type === 'OBSTACLE' && styles.chipActive]}
                  onPress={() => setDraftFilters((d) => ({ ...d, type: 'OBSTACLE' }))}
                >
                  <Text style={[styles.chipText, draftFilters.type === 'OBSTACLE' && styles.chipTextActive]}>
                    Obstacle
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, draftFilters.type === 'DAMAGE' && styles.chipActive]}
                  onPress={() => setDraftFilters((d) => ({ ...d, type: 'DAMAGE' }))}
                >
                  <Text style={[styles.chipText, draftFilters.type === 'DAMAGE' && styles.chipTextActive]}>
                    Damage
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.chipRow}>
                <TouchableOpacity
                  style={[styles.chip, !draftFilters.status && styles.chipActive]}
                  onPress={() => setDraftFilters((d) => ({ ...d, status: '' }))}
                >
                  <Text style={[styles.chipText, !draftFilters.status && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, draftFilters.status === 'OPEN' && styles.chipActive]}
                  onPress={() => setDraftFilters((d) => ({ ...d, status: 'OPEN' }))}
                >
                  <Text style={[styles.chipText, draftFilters.status === 'OPEN' && styles.chipTextActive]}>
                    Open
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, draftFilters.status === 'CLOSED' && styles.chipActive]}
                  onPress={() => setDraftFilters((d) => ({ ...d, status: 'CLOSED' }))}
                >
                  <Text style={[styles.chipText, draftFilters.status === 'CLOSED' && styles.chipTextActive]}>
                    Closed
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Zone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity
                  style={[styles.chip, !draftFilters.zoneId && styles.chipActive]}
                  onPress={() => setDraftFilters((d) => ({ ...d, zoneId: '', roadId: '' }))}
                >
                  <Text style={[styles.chipText, !draftFilters.zoneId && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {zones.map((z) => (
                  <TouchableOpacity
                    key={z.id}
                    style={[styles.chip, draftFilters.zoneId === z.id && styles.chipActive]}
                    onPress={() =>
                      setDraftFilters((d) => ({ ...d, zoneId: z.id, roadId: '' }))
                    }
                  >
                    <Text style={[styles.chipText, draftFilters.zoneId === z.id && styles.chipTextActive]}>
                      {z.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {draftFilters.zoneId && (
                <>
                  <View style={styles.roadSearchRow}>
                    <Text style={styles.filterLabel}>Road</Text>
                    <TextInput
                      value={roadSearch}
                      onChangeText={setRoadSearch}
                      placeholder="Search roads..."
                      mode="outlined"
                      style={styles.roadSearch}
                      left={<TextInput.Icon icon="magnify" />}
                      accessibilityLabel="Search roads"
                    />
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                    <TouchableOpacity
                      style={[styles.chip, !draftFilters.roadId && styles.chipActive]}
                      onPress={() => setDraftFilters((d) => ({ ...d, roadId: '' }))}
                    >
                      <Text style={[styles.chipText, !draftFilters.roadId && styles.chipTextActive]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    {filteredRoads.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        style={[styles.chip, draftFilters.roadId === r.id && styles.chipActive]}
                        onPress={() => setDraftFilters((d) => ({ ...d, roadId: r.id }))}
                      >
                        <Text style={[styles.chipText, draftFilters.roadId === r.id && styles.chipTextActive]}>
                          {r.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {filteredRoads.length === 0 && roads.length > 0 && (
                    <Text style={styles.hint}>No roads match "{roadSearch}"</Text>
                  )}
                </>
              )}
        </BottomSheetScrollView>

        <View style={styles.modalFooter}>
          <Button mode="outlined" onPress={clearFilters} style={styles.footerBtn}>
            Clear
          </Button>
          <Button mode="contained" onPress={applyFilters} style={styles.footerBtn}>
            Apply
          </Button>
        </View>
      </BottomSheetModal>

      {isLoading ? (
        <View style={styles.listContent}>
          <CaseCardSkeleton />
          <CaseCardSkeleton />
          <CaseCardSkeleton />
          <CaseCardSkeleton />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <EmptyState
            title={hasActiveFilters(filters) ? 'No matching cases' : 'No cases yet'}
            message={
              hasActiveFilters(filters)
                ? 'Try different filters.'
                : 'Create your first case to get started.'
            }
            actionLabel={hasActiveFilters(filters) ? 'Clear filters' : 'Create Case'}
            onAction={
              hasActiveFilters(filters)
                ? clearFilters
                : () => (navigation as any).navigate('CreateCase')
            }
          />
        </View>
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCase}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={() => refetch()}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetBackground: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  sheetHandle: {
    backgroundColor: colors.border,
    width: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    ...typography.titleMedium,
    color: colors.text,
  },
  closeBtn: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  closeText: {
    fontSize: 20,
    color: colors.textMuted,
  },
  modalBody: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerBtn: {
    minWidth: 100,
  },
  filterLabel: {
    ...typography.label,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chipScroll: {
    marginBottom: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  roadSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  roadSearch: {
    flex: 1,
    maxWidth: 200,
    marginLeft: spacing.md,
    backgroundColor: colors.surface,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
