import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { settingsService } from '../services/supabaseService';
import toast from 'react-hot-toast';
import { Upload, X, Building2, Briefcase } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';

export default function Settings() {
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [contractorLogoFile, setContractorLogoFile] = useState<File | null>(null);
  const [ownerLogoFile, setOwnerLogoFile] = useState<File | null>(null);

  const { data: settings, isLoading } = useQuery('settings', () => settingsService.get());

  const uploadContractorLogo = useMutation(
    (file: File) => settingsService.uploadLogo(file, 'contractor'),
    {
      onSuccess: () => {
        toast.success('Contractor logo uploaded successfully!');
        queryClient.invalidateQueries('settings');
        setContractorLogoFile(null);
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to upload contractor logo'); },
    }
  );
  const uploadOwnerLogo = useMutation(
    (file: File) => settingsService.uploadLogo(file, 'owner'),
    {
      onSuccess: () => {
        toast.success('Owner logo uploaded successfully!');
        queryClient.invalidateQueries('settings');
        setOwnerLogoFile(null);
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to upload owner logo'); },
    }
  );
  const deleteContractorLogo = useMutation(
    () => settingsService.deleteLogo('contractor'),
    {
      onSuccess: () => {
        toast.success('Contractor logo deleted successfully!');
        queryClient.invalidateQueries('settings');
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to delete contractor logo'); },
    }
  );
  const deleteOwnerLogo = useMutation(
    () => settingsService.deleteLogo('owner'),
    {
      onSuccess: () => {
        toast.success('Owner logo deleted successfully!');
        queryClient.invalidateQueries('settings');
      },
      onError: (err: any) => { toast.error(err.message || 'Failed to delete owner logo'); },
    }
  );

  if (user?.role !== 'ADMIN') {
    return (
      <Card>
        <div className="py-12 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">Access denied. Admin only.</p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">System Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage company logos</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">System Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage company logos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <Briefcase size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contractor Logo</h2>
          </div>
          {settings?.contractor_logo_url || settings?.contractorLogoUrl ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[140px]">
                <img
                  src={settings.contractor_logo_url || settings.contractorLogoUrl}
                  alt="Contractor Logo"
                  className="max-h-28 max-w-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <label className="btn btn-secondary flex-1 cursor-pointer">
                  <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setContractorLogoFile(e.target.files[0])}
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
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">New file: {contractorLogoFile.name}</p>
                  <button
                    onClick={() => uploadContractorLogo.mutate(contractorLogoFile)}
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
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[140px]">
                <Briefcase size={48} className="text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No logo uploaded</p>
              </div>
              <label className="btn btn-primary w-full cursor-pointer">
                <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                Upload Contractor Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setContractorLogoFile(e.target.files[0])}
                />
              </label>
              {contractorLogoFile && (
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Selected: {contractorLogoFile.name}</p>
                  <button
                    onClick={() => uploadContractorLogo.mutate(contractorLogoFile)}
                    disabled={uploadContractorLogo.isLoading}
                    className="btn btn-primary w-full"
                  >
                    {uploadContractorLogo.isLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <Building2 size={24} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Owner Logo</h2>
          </div>
          {settings?.owner_logo_url || settings?.ownerLogoUrl ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[140px]">
                <img
                  src={settings.owner_logo_url || settings.ownerLogoUrl}
                  alt="Owner Logo"
                  className="max-h-28 max-w-full object-contain"
                />
              </div>
              <div className="flex gap-2">
                <label className="btn btn-secondary flex-1 cursor-pointer">
                  <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && setOwnerLogoFile(e.target.files[0])}
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
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">New file: {ownerLogoFile.name}</p>
                  <button
                    onClick={() => uploadOwnerLogo.mutate(ownerLogoFile)}
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
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 min-h-[140px]">
                <Building2 size={48} className="text-gray-400 dark:text-gray-500 mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No logo uploaded</p>
              </div>
              <label className="btn btn-primary w-full cursor-pointer">
                <Upload size={16} className={isRTL ? 'ml-2' : 'mr-2'} />
                Upload Owner Logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setOwnerLogoFile(e.target.files[0])}
                />
              </label>
              {ownerLogoFile && (
                <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Selected: {ownerLogoFile.name}</p>
                  <button
                    onClick={() => uploadOwnerLogo.mutate(ownerLogoFile)}
                    disabled={uploadOwnerLogo.isLoading}
                    className="btn btn-primary w-full"
                  >
                    {uploadOwnerLogo.isLoading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
