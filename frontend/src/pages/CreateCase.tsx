import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../services/api';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import { Camera, MapPin, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CaseFormData {
  type: 'OBSTACLE' | 'DAMAGE';
  zoneId: string;
  roadId: string;
  developerId?: string;
  description: string;
  plannedWork?: string;
  latitude: number;
  longitude: number;
}

export default function CreateCase() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZone, setSelectedZone] = useState('');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CaseFormData>();
  const caseType = watch('type');

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Please enter manually.');
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const { data: zones } = useQuery('zones', async () => {
    const response = await api.get('/zones');
    return response.data.zones;
  });

  const { data: roads } = useQuery(
    ['roads', selectedZone],
    async () => {
      if (!selectedZone) return [];
      const response = await api.get(`/roads/zone/${selectedZone}`);
      return response.data.roads;
    },
    { enabled: !!selectedZone }
  );

  const { data: developers } = useQuery('developers', async () => {
    const response = await api.get('/developers');
    return response.data.developers;
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos(prev => [...prev, ...newPhotos]);
      
      newPhotos.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CaseFormData) => {
    if (!location) {
      toast.error('Please allow location access or enter coordinates manually');
      return;
    }

    if (photos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('zoneId', data.zoneId);
      formData.append('roadId', data.roadId);
      if (data.developerId) formData.append('developerId', data.developerId);
      formData.append('description', data.description);
      if (data.plannedWork) formData.append('plannedWork', data.plannedWork);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await api.post('/cases', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Case created successfully!');
      navigate(`/cases/${response.data.case.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create case');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cases" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Case</h1>
          <p className="text-gray-600 mt-1">Report a new obstacle or damage</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Case Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="label">Case Type *</label>
              <select
                {...register('type', { required: true })}
                className="input"
              >
                <option value="">Select type</option>
                <option value="OBSTACLE">Obstacle</option>
                <option value="DAMAGE">Damage</option>
              </select>
              {errors.type && <p className="text-red-600 text-sm mt-1">Type is required</p>}
            </div>

            <div>
              <label className="label">Zone *</label>
              <select
                {...register('zoneId', { required: true })}
                onChange={(e) => {
                  setSelectedZone(e.target.value);
                  register('zoneId').onChange(e);
                }}
                className="input"
              >
                <option value="">Select zone</option>
                {zones?.map((zone: any) => (
                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                ))}
              </select>
              {errors.zoneId && <p className="text-red-600 text-sm mt-1">Zone is required</p>}
            </div>

            <div>
              <label className="label">Road *</label>
              <select
                {...register('roadId', { required: true })}
                disabled={!selectedZone}
                className="input disabled:bg-gray-100"
              >
                <option value="">{selectedZone ? 'Select road' : 'Select zone first'}</option>
                {roads?.map((road: any) => (
                  <option key={road.id} value={road.id}>{road.name}</option>
                ))}
              </select>
              {errors.roadId && <p className="text-red-600 text-sm mt-1">Road is required</p>}
            </div>

            <div>
              <label className="label">Developer (Optional)</label>
              <select
                {...register('developerId')}
                className="input"
              >
                <option value="">Select developer</option>
                {developers?.map((dev: any) => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Description *</label>
              <textarea
                {...register('description', { required: true })}
                rows={4}
                className="input"
                placeholder="Describe the obstacle or damage..."
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">Description is required</p>}
            </div>

            {caseType === 'OBSTACLE' && (
              <div>
                <label className="label">Planned Work *</label>
                <textarea
                  {...register('plannedWork', { required: caseType === 'OBSTACLE' })}
                  rows={3}
                  className="input"
                  placeholder="Describe the planned work..."
                />
                {errors.plannedWork && <p className="text-red-600 text-sm mt-1">Planned work is required for obstacles</p>}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Location</h2>
          {location ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin size={16} />
              <span>Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}</span>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Getting your location...</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Photos *</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <div className="text-center">
                <Camera size={32} className="mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload photos</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {photoPreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary flex-1">
            Create Case
          </button>
          <Link to="/cases" className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
