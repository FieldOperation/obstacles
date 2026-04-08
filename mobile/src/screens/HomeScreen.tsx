import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { settingsService, casesService } from '../services/supabaseService';
import { AppHeader, ActionCard } from '../components';
import { colors, spacing } from '../theme/tokens';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });

  const { data: caseData } = useQuery({
    queryKey: ['cases', 'open-count'],
    queryFn: async () => {
      const { cases } = await casesService.getAll({}, 1, 1000);
      return cases;
    },
  });

  const openCount = caseData?.filter((c: any) => c.status === 'OPEN').length ?? 0;
  const greeting = user?.name ? `Welcome, ${user.name}` : 'Welcome';
  const subtitle = openCount > 0 ? `${openCount} open case${openCount === 1 ? '' : 's'}` : undefined;

  const logos =
    settings?.contractorLogoUrl || settings?.ownerLogoUrl
      ? {
          contractor: settings.contractorLogoUrl || undefined,
          owner: settings.ownerLogoUrl || undefined,
        }
      : undefined;

  const canCreate = user?.role === 'ADMIN' || user?.role === 'WORKER';

  return (
    <View style={styles.container}>
      <AppHeader
        title={greeting}
        subtitle={subtitle}
        rightAction={{ label: 'Logout', onPress: logout }}
        logos={logos}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ActionCard
          title="View Cases"
          subtitle="Browse all obstacles and damages"
          onPress={() => navigation.navigate('CasesList' as never)}
          accessibilityLabel="View cases"
        />
        {canCreate && (
          <ActionCard
            title="Create Case"
            subtitle="Report a new obstacle or damage"
            onPress={() => navigation.navigate('CreateCase' as never)}
            accessibilityLabel="Create new case"
          />
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
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
