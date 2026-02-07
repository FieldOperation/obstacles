import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  SegmentedButtons,
  ActivityIndicator,
} from 'react-native-paper';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function CreateCaseScreen() {
  const navigation = useNavigation();
  const [type, setType] = useState('OBSTACLE');
  const [zoneId, setZoneId] = useState('');
  const [roadId, setRoadId] = useState('');
  const [description, setDescription] = useState('');
  const [plannedWork, setPlannedWork] = useState('');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<any[]>([]);
  const [roads, setRoads] = useState<any[]>([]);

  useEffect(() => {
    loadZones();
    getLocation();
  }, []);

  useEffect(() => {
    if (zoneId) {
      loadRoads(zoneId);
    } else {
      setRoads([]);
    }
  }, [zoneId]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadZones = async () => {
    try {
      const response = await api.get('/zones');
      setZones(response.data.zones);
    } catch (error) {
      console.error('Error loading zones:', error);
    }
  };

  const loadRoads = async (zoneId: string) => {
    try {
      const response = await api.get(`/roads/zone/${zoneId}`);
      setRoads(response.data.roads);
    } catch (error) {
      console.error('Error loading roads:', error);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotos([...photos, ...result.assets.map(asset => asset.uri)]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
    }
  };

  const handleSubmit = async () => {
    if (!location) {
      Alert.alert('Error', 'Location is required');
      return;
    }

    if (!zoneId) {
      Alert.alert('Error', 'Zone is required');
      return;
    }

    if (!roadId) {
      Alert.alert('Error', 'Road is required');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }

    if (type === 'OBSTACLE' && !plannedWork.trim()) {
      Alert.alert('Error', 'Planned work is required for obstacles');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('Error', 'At least one photo is required');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('zoneId', zoneId);
      formData.append('roadId', roadId);
      formData.append('description', description);
      if (plannedWork) formData.append('plannedWork', plannedWork);
      formData.append('latitude', location.coords.latitude.toString());
      formData.append('longitude', location.coords.longitude.toString());

      photos.forEach((uri, index) => {
        formData.append('photos', {
          uri,
          type: 'image/jpeg',
          name: `photo_${index}.jpg`,
        } as any);
      });

      const response = await api.post('/cases', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Case created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.title}>
            Create New Case
          </Text>

          <SegmentedButtons
            value={type}
            onValueChange={setType}
            buttons={[
              { value: 'OBSTACLE', label: 'Obstacle' },
              { value: 'DAMAGE', label: 'Damage' },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.input}>
            <Text variant="bodyMedium" style={styles.label}>Zone *</Text>
            <View style={styles.pickerContainer}>
              {zones.map((zone) => (
                <Button
                  key={zone.id}
                  mode={zoneId === zone.id ? 'contained' : 'outlined'}
                  onPress={() => {
                    setZoneId(zone.id);
                    setRoadId(''); // Reset road when zone changes
                  }}
                  style={styles.pickerButton}
                >
                  {zone.name}
                </Button>
              ))}
            </View>
          </View>

          {zoneId && (
            <View style={styles.input}>
              <Text variant="bodyMedium" style={styles.label}>Road *</Text>
              <View style={styles.pickerContainer}>
                {roads.map((road) => (
                  <Button
                    key={road.id}
                    mode={roadId === road.id ? 'contained' : 'outlined'}
                    onPress={() => setRoadId(road.id)}
                    style={styles.pickerButton}
                  >
                    {road.name}
                  </Button>
                ))}
              </View>
            </View>
          )}

          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            multiline
            numberOfLines={4}
            style={styles.input}
          />

          {type === 'OBSTACLE' && (
            <TextInput
              label="Planned Work *"
              value={plannedWork}
              onChangeText={setPlannedWork}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />
          )}

          <View style={styles.locationContainer}>
            <Text variant="bodyMedium">
              Location: {location
                ? `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`
                : 'Getting location...'}
            </Text>
          </View>

          <View style={styles.photoContainer}>
            <Button mode="outlined" onPress={pickImage} style={styles.photoButton}>
              Select Photos
            </Button>
            <Button mode="outlined" onPress={takePhoto} style={styles.photoButton}>
              Take Photo
            </Button>
          </View>

          {photos.length > 0 && (
            <View style={styles.photosPreview}>
              {photos.map((uri, index) => (
                <Image key={index} source={{ uri }} style={styles.photoPreview} />
              ))}
            </View>
          )}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            Create Case
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 4,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  locationContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#e0f2fe',
    borderRadius: 8,
  },
  photoContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
  },
  photosPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  submitButton: {
    marginTop: 8,
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerButton: {
    marginBottom: 8,
  },
});
