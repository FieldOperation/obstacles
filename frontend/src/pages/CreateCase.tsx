import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { casesService, zonesService, roadsService, developersService } from '../services/supabaseService';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import { Camera, MapPin, ArrowLeft, Upload } from 'lucide-react';

interface CaseFormData {
  type: 'OBSTACLE' | 'DAMAGE';
  zoneId: string;
  roadId: string;
  developerId?: string;
  description: string;
  plannedWork?: string;
  latitude: number;
  longitude: number;
  photoLatitude?: string;
  photoLongitude?: string;
}

export default function CreateCase() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedZone, setSelectedZone] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<CaseFormData>();
  const caseType = watch('type');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => toast.error('Could not get your location. Please enter manually.'),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const { data: zones } = useQuery('zones', () => zonesService.getAll().then((r) => r.zones));
  const { data: roads } = useQuery(
    ['roads', selectedZone],
    () => (selectedZone ? roadsService.getAll(selectedZone).then((r) => r.roads) : []),
    { enabled: !!selectedZone }
  );
  const { data: developers } = useQuery('developers', () => developersService.getAll().then((r) => r.developers));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files);
      setPhotos((prev) => [...prev, ...newPhotos]);
      newPhotos.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      const newPhotos = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      setPhotos((prev) => [...prev, ...newPhotos]);
      newPhotos.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => setPhotoPreviews((prev) => [...prev, reader.result as string]);
        reader.readAsDataURL(file);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const createCaseMutation = useMutation(
    (formData: CaseFormData) => casesService.create(formData, photos),
    {
      onSuccess: (result) => {
        toast.success('Case created successfully!');
        navigate(`/cases/${result.case.id}`);
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to create case'); },
    }
  );

  const onSubmit = async (data: CaseFormData) => {
    if (!location) {
      toast.error('Please allow location access or enter coordinates manually');
      return;
    }
    if (photos.length === 0) {
      toast.error('Please upload at least one photo');
      return;
    }
    createCaseMutation.mutate({
      ...data,
      latitude: location.lat,
      longitude: location.lng,
      photoLatitude: location.lat.toString(),
      photoLongitude: location.lng.toString(),
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/cases" className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="page-title">Create New Case</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Report a new obstacle or damage</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="card card-body">
          <h2 className="section-title mb-4">Case Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Case Type *</label>
              <select {...register('type', { required: true })} className="input">
                <option value="">Select type</option>
                <option value="OBSTACLE">Obstacle</option>
                <option value="DAMAGE">Damage</option>
              </select>
              {errors.type && <p className="text-red-600 dark:text-red-400 text-sm mt-1">Type is required</p>}
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
              {errors.zoneId && <p className="text-red-600 dark:text-red-400 text-sm mt-1">Zone is required</p>}
            </div>
            <div>
              <label className="label">Road *</label>
              <select
                {...register('roadId', { required: true })}
                disabled={!selectedZone}
                className="input disabled:opacity-60"
              >
                <option value="">{selectedZone ? 'Select road' : 'Select zone first'}</option>
                {roads?.map((road: any) => (
                  <option key={road.id} value={road.id}>{road.name}</option>
                ))}
              </select>
              {errors.roadId && <p className="text-red-600 dark:text-red-400 text-sm mt-1">Road is required</p>}
            </div>
            <div>
              <label className="label">Developer (Optional)</label>
              <select {...register('developerId')} className="input">
                <option value="">Select developer</option>
                {developers?.map((dev: any) => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="label">Description *</label>
            <textarea
              {...register('description', { required: true })}
              rows={4}
              className="input"
              placeholder="Describe the obstacle or damage..."
            />
            {errors.description && <p className="text-red-600 dark:text-red-400 text-sm mt-1">Description is required</p>}
          </div>
          {caseType === 'OBSTACLE' && (
            <div className="mt-4">
              <label className="label">Planned Work *</label>
              <textarea
                {...register('plannedWork', { required: caseType === 'OBSTACLE' })}
                rows={3}
                className="input"
                placeholder="Describe the planned work..."
              />
              {errors.plannedWork && <p className="text-red-600 dark:text-red-400 text-sm mt-1">Planned work is required for obstacles</p>}
            </div>
          )}
        </div>

        <div className="card card-body">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <MapPin size={18} />
            Location
          </h2>
          {location ? (
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <MapPin size={16} className="text-primary-500" />
              Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-500">Getting your location…</p>
          )}
        </div>

        <div className="card card-body">
          <h2 className="section-title mb-4 flex items-center gap-2">
            <Camera size={18} />
            Photos *
          </h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
            }`}
          >
            <Upload size={40} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Drag & drop photos here, or click to browse</p>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="btn btn-secondary mt-2 cursor-pointer">
              Choose files
            </label>
          </div>
          {photoPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {photoPreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-28 object-cover rounded-xl border border-gray-200 dark:border-gray-600" />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Link to="/cases" className="btn btn-secondary flex-1 sm:flex-initial">
            Cancel
          </Link>
          <button
            type="submit"
            className="btn btn-primary flex-1"
            disabled={createCaseMutation.isLoading}
          >
            {createCaseMutation.isLoading ? 'Creating…' : 'Create Case'}
          </button>
        </div>
      </form>
    </div>
  );
}
