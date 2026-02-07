import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { Upload, X, Building2, Briefcase } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contractorLogoFile, setContractorLogoFile] = useState<File | null>(null);
  const [ownerLogoFile, setOwnerLogoFile] = useState<File | null>(null);

  const { data: settings, isLoading } = useQuery('settings', async () => {
    const response = await api.get('/settings');
    return response.data.settings;
  });

  const uploadContractorLogo = useMutation(
    async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('logoType', 'contractor');
      const response = await api.post('/settings/contractor-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Contractor logo uploaded successfully!');
        queryClient.invalidateQueries('settings');
        setContractorLogoFile(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to upload contractor logo');
      }
    }
  );

  const uploadOwnerLogo = useMutation(
    async (file: File) => {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('logoType', 'owner');
      const response = await api.post('/settings/owner-logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    },
    {
      onSuccess: () => {
        toast.success('Owner logo uploaded successfully!');
        queryClient.invalidateQueries('settings');
        setOwnerLogoFile(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to upload owner logo');
      }
    }
  );

  const deleteContractorLogo = useMutation(
    async () => {
      await api.delete('/settings/contractor-logo');
    },
    {
      onSuccess: () => {
        toast.success('Contractor logo deleted successfully!');
        queryClient.invalidateQueries('settings');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete contractor logo');
      }
    }
  );

  const deleteOwnerLogo = useMutation(
    async () => {
      await api.delete('/settings/owner-logo');
    },
    {
      onSuccess: () => {
        toast.success('Owner logo deleted successfully!');
        queryClient.invalidateQueries('settings');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to delete owner logo');
      }
    }
  );

  const handleContractorLogoUpload = () => {
    if (contractorLogoFile) {
      uploadContractorLogo.mutate(contractorLogoFile);
    }
  };

  const handleOwnerLogoUpload = () => {
    if (ownerLogoFile) {
      uploadOwnerLogo.mutate(ownerLogoFile);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Access denied. Admin only.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Manage company logos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contractor Logo */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Briefcase size={24} className={`${isRTL ? 'ml-3' : 'mr-3'} text-primary-600`} />
            <h2 className="text-xl font-semibold">Contractor Company Logo</h2>
          </div>

          {settings?.contractorLogoUrl ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
                <img
                  src={settings.contractorLogoUrl}
                  alt="Contractor Logo"
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <label className="btn btn-secondary flex-1 cursor-pointer">
                  <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                  Replace Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setContractorLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={() => deleteContractorLogo.mutate()}
                  disabled={deleteContractorLogo.isLoading}
                  className="btn btn-danger"
                >
                  <X size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                  Delete
                </button>
              </div>
              {contractorLogoFile && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">New file: {contractorLogoFile.name}</p>
                  <button
                    onClick={handleContractorLogoUpload}
                    disabled={uploadContractorLogo.isLoading}
                    className="btn btn-primary w-full"
                  >
                    {uploadContractorLogo.isLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50">
                <Briefcase size={48} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No logo uploaded</p>
              </div>
              <label className="btn btn-primary w-full cursor-pointer">
                <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                Upload Contractor Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setContractorLogoFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              {contractorLogoFile && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">Selected: {contractorLogoFile.name}</p>
                  <button
                    onClick={handleContractorLogoUpload}
                    disabled={uploadContractorLogo.isLoading}
                    className="btn btn-primary w-full"
                  >
                    {uploadContractorLogo.isLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Owner Logo */}
        <div className="card">
          <div className="flex items-center mb-4">
            <Building2 size={24} className={`${isRTL ? 'ml-3' : 'mr-3'} text-primary-600`} />
            <h2 className="text-xl font-semibold">Owner Company Logo</h2>
          </div>

          {settings?.ownerLogoUrl ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center bg-gray-50">
                <img
                  src={settings.ownerLogoUrl}
                  alt="Owner Logo"
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <label className="btn btn-secondary flex-1 cursor-pointer">
                  <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                  Replace Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setOwnerLogoFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
                <button
                  onClick={() => deleteOwnerLogo.mutate()}
                  disabled={deleteOwnerLogo.isLoading}
                  className="btn btn-danger"
                >
                  <X size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                  Delete
                </button>
              </div>
              {ownerLogoFile && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">New file: {ownerLogoFile.name}</p>
                  <button
                    onClick={handleOwnerLogoUpload}
                    disabled={uploadOwnerLogo.isLoading}
                    className="btn btn-primary w-full"
                  >
                    {uploadOwnerLogo.isLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50">
                <Building2 size={48} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">No logo uploaded</p>
              </div>
              <label className="btn btn-primary w-full cursor-pointer">
                <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                Upload Owner Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setOwnerLogoFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
              {ownerLogoFile && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">Selected: {ownerLogoFile.name}</p>
                  <button
                    onClick={handleOwnerLogoUpload}
                    disabled={uploadOwnerLogo.isLoading}
                    className="btn btn-primary w-full"
                  >
                    {uploadOwnerLogo.isLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
