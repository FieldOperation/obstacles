import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  Button,
  Text,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { zonesService, roadsService, developersService, casesService, settingsService } from '../services/supabaseService';
import { useNavigation } from '@react-navigation/native';
import { AppHeader, LocationRow, PhotoThumbnail } from '../components';
import { colors, spacing, radii, typography, shadows } from '../theme/tokens';

export default function CreateCaseScreen() {
  const navigation = useNavigation();
  const [type, setType] = useState('OBSTACLE');
  const [zoneId, setZoneId] = useState('');
  const [roadId, setRoadId] = useState('');
  const [developerId, setDeveloperId] = useState('');
  const [description, setDescription] = useState('');
  const [plannedWork, setPlannedWork] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationState, setLocationState] = useState<'loading' | 'success' | 'error'>('loading');
  const [photos, setPhotos] = useState<string[]>([]);
  const photoBase64Ref = useRef<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [roads, setRoads] = useState<any[]>([]);
  const [developers, setDevelopers] = useState<any[]>([]);
  const [roadSearch, setRoadSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.get(),
  });

  const logos =
    settings?.contractorLogoUrl || settings?.ownerLogoUrl
      ? { contractor: settings.contractorLogoUrl || undefined, owner: settings.ownerLogoUrl || undefined }
      : undefined;

  const getLocation = async () => {
    setLocationState('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState('error');
        Alert.alert(
          'Permission denied',
          'Location permission is required to create a case.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
      setLocationState('success');
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationState('error');
    }
  };

  useEffect(() => {
    loadZones();
    loadDevelopers();
    getLocation();
  }, []);

  useEffect(() => {
    if (zoneId) {
      loadRoads(zoneId);
      setRoadSearch('');
    } else {
      setRoads([]);
      setRoadId('');
      setRoadSearch('');
    }
  }, [zoneId]);

  const loadZones = async () => {
    try {
      const { zones: z } = await zonesService.getAll();
      setZones(z);
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadRoads = async (zoneId: string) => {
    try {
      const { roads: r } = await roadsService.getAll(zoneId);
      setRoads(r);
    } catch (error) {
      console.error('Error loading roads:', error);
    }
  };

  const loadDevelopers = async () => {
    try {
      const { developers: d } = await developersService.getAll();
      setDevelopers(d);
    } catch (error) {
      console.error('Error loading developers:', error);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Photo library access is needed to select images.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });
      if (!result.canceled && result.assets?.length) {
        const assets = result.assets;
        assets.forEach((a) => {
          const uri = a.uri;
          const b64 = (a as any).base64;
          if (uri) {
            photoBase64Ref.current[uri] = typeof b64 === 'string' ? b64 : '';
          }
        });
        setPhotos((prev) => [...prev, ...assets.map((a) => a.uri).filter(Boolean)]);
        setErrors((e) => ({ ...e, photos: '' }));
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to open photo library');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Camera access is needed to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: true });
      if (!result.canceled && result.assets?.[0]) {
        const a = result.assets[0];
        const uri = a.uri;
        if (uri) {
          photoBase64Ref.current[uri] = typeof (a as any).base64 === 'string' ? (a as any).base64 : '';
          setPhotos((prev) => [...prev, uri]);
          setErrors((e) => ({ ...e, photos: '' }));
        }
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to open camera');
    }
  };

  const removePhoto = (index: number) => {
    const uri = photos[index];
    if (uri) delete photoBase64Ref.current[uri];
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!location) e.location = 'Location is required';
    if (!zoneId) e.zone = 'Zone is required';
    if (!roadId) e.road = 'Road is required';
    if (!description.trim()) e.description = 'Description is required';
    if (type === 'OBSTACLE' && !plannedWork.trim()) e.plannedWork = 'Planned work is required';
    if (photos.length === 0) e.photos = 'At least one photo is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const filteredRoads = roads.filter((r) =>
    r.name?.toLowerCase().includes(roadSearch.trim().toLowerCase())
  );

  const isFormValid =
    location &&
    zoneId &&
    roadId &&
    description.trim().length > 0 &&
    (type !== 'OBSTACLE' || plannedWork.trim().length > 0) &&
    photos.length > 0;

  const handleSubmit = async () => {
    if (!validate() || submitting || !location) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const caseData = {
        type,
        zoneId,
        roadId,
        developerId: developerId || null,
        description: description.trim(),
        plannedWork: plannedWork.trim(),
        latitude: location.coords.latitude.toString(),
        longitude: location.coords.longitude.toString(),
      };
      const photoItems = photos.map((uri) => ({
        uri,
        base64: photoBase64Ref.current[uri] || undefined,
      }));
      await casesService.create(caseData, photoItems);
      Alert.alert('Success', 'Case created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Create Case"
        leftAction={{ onPress: () => navigation.goBack() }}
        logos={logos}
      />
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <SegmentedButtons
              value={type}
              onValueChange={setType}
              buttons={[
                { value: 'OBSTACLE', label: 'Obstacle' },
                { value: 'DAMAGE', label: 'Damage' },
              ]}
              style={styles.segmented}
            />

            <View style={styles.section}>
              <Text style={styles.label} maxFontSizeMultiplier={1.2}>Zone *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pills}
              >
                {zones.map((z) => (
                  <Button
                    key={z.id}
                    mode={zoneId === z.id ? 'contained' : 'outlined'}
                    onPress={() => {
                      setZoneId(z.id);
                      setRoadId('');
                    }}
                    style={styles.pill}
                    contentStyle={styles.pillContent}
                    accessibilityLabel={`Select zone ${z.name}`}
                  >
                    {z.name}
                  </Button>
                ))}
              </ScrollView>
              {errors.zone && (
                <Text style={styles.error} maxFontSizeMultiplier={1.2}>{errors.zone}</Text>
              )}
            </View>

            {zoneId && (
              <View style={styles.section}>
                <Text style={styles.label} maxFontSizeMultiplier={1.2}>Road *</Text>
                <TextInput
                  value={roadSearch}
                  onChangeText={setRoadSearch}
                  placeholder="Search roads…"
                  mode="outlined"
                  left={<TextInput.Icon icon="magnify" />}
                  style={styles.searchInput}
                  contentStyle={styles.searchInputContent}
                  placeholderTextColor={colors.textMuted}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                  accessibilityLabel="Search roads"
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.pills}
                >
                  {filteredRoads.map((r) => (
                    <Button
                      key={r.id}
                      mode={roadId === r.id ? 'contained' : 'outlined'}
                      onPress={() => setRoadId(r.id)}
                      style={styles.pill}
                      contentStyle={styles.pillContent}
                      accessibilityLabel={`Select road ${r.name}`}
                    >
                      {r.name}
                    </Button>
                  ))}
                </ScrollView>
                {filteredRoads.length === 0 && roads.length > 0 && (
                  <Text style={styles.hint} maxFontSizeMultiplier={1.2}>
                    No roads match "{roadSearch}"
                  </Text>
                )}
                {errors.road && (
                  <Text style={styles.error} maxFontSizeMultiplier={1.2}>{errors.road}</Text>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.label} maxFontSizeMultiplier={1.2}>Developer</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.pills}
              >
                <Button
                  mode={!developerId ? 'contained' : 'outlined'}
                  onPress={() => setDeveloperId('')}
                  style={styles.pill}
                  contentStyle={styles.pillContent}
                  accessibilityLabel="No developer"
                >
                  None
                </Button>
                {developers.map((d) => (
                  <Button
                    key={d.id}
                    mode={developerId === d.id ? 'contained' : 'outlined'}
                    onPress={() => setDeveloperId(d.id)}
                    style={styles.pill}
                    contentStyle={styles.pillContent}
                    accessibilityLabel={`Select developer ${d.name}`}
                  >
                    {d.name}
                  </Button>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.label} maxFontSizeMultiplier={1.2}>Description *</Text>
              <TextInput
                value={description}
                onChangeText={(t) => {
                  setDescription(t);
                  if (errors.description) setErrors((e) => ({ ...e, description: '' }));
                }}
                mode="outlined"
                multiline
                numberOfLines={4}
                placeholder="Describe the obstacle or damage"
                style={styles.input}
                error={!!errors.description}
                accessibilityLabel="Case description"
              />
              {errors.description && (
                <Text style={styles.error} maxFontSizeMultiplier={1.2}>{errors.description}</Text>
              )}
            </View>

            {type === 'OBSTACLE' && (
              <View style={styles.section}>
                <Text style={styles.label} maxFontSizeMultiplier={1.2}>Planned Work *</Text>
                <TextInput
                  value={plannedWork}
                  onChangeText={(t) => {
                    setPlannedWork(t);
                    if (errors.plannedWork) setErrors((e) => ({ ...e, plannedWork: '' }));
                  }}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  placeholder="What work is planned?"
                  style={styles.input}
                  error={!!errors.plannedWork}
                  accessibilityLabel="Planned work"
                />
                {errors.plannedWork && (
                  <Text style={styles.error} maxFontSizeMultiplier={1.2}>{errors.plannedWork}</Text>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.label} maxFontSizeMultiplier={1.2}>Location</Text>
              <LocationRow
                state={locationState}
                coords={location ? { lat: location.coords.latitude, lng: location.coords.longitude } : undefined}
                onRetry={getLocation}
              />
              {errors.location && (
                <Text style={styles.error} maxFontSizeMultiplier={1.2}>{errors.location}</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.label} maxFontSizeMultiplier={1.2}>Photos *</Text>
              <View style={styles.photoButtons}>
                <Button mode="outlined" onPress={pickImage} style={styles.photoBtn}>
                  Select Photos
                </Button>
                <Button mode="outlined" onPress={takePhoto} style={styles.photoBtn}>
                  Take Photo
                </Button>
              </View>
              {photos.length > 0 && (
                <View style={styles.thumbnails}>
                  {photos.map((uri, i) => (
                    <PhotoThumbnail key={i} uri={uri} index={i} onRemove={() => removePhoto(i)} />
                  ))}
                </View>
              )}
              {errors.photos && (
                <Text style={styles.error} maxFontSizeMultiplier={1.2}>{errors.photos}</Text>
              )}
            </View>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={submitting}
              disabled={!isFormValid || submitting}
              style={[styles.submit, shadows.button]}
              contentStyle={styles.submitContent}
              accessibilityLabel={submitting ? 'Creating case…' : 'Create case'}
            >
              {submitting ? 'Creating…' : 'Create Case'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    paddingTop: spacing.md,
  },
  segmented: {
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    borderRadius: radii.md,
  },
  searchInputContent: {
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
  hint: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  pills: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  pill: {
    marginRight: spacing.sm,
  },
  pillContent: {
    minHeight: 44,
  },
  input: {
    backgroundColor: colors.surface,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  photoBtn: {
    flex: 1,
  },
  thumbnails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  submitContent: {
    paddingVertical: spacing.sm,
    minHeight: 48,
  },
});
