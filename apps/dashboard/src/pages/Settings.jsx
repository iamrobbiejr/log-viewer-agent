import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllSettings, updateSettings } from '../api/settingsApi';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

export default function Settings() {
  const queryClient = useQueryClient();
  const [allowedDomains, setAllowedDomains] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchAllSettings,
  });

  useEffect(() => {
    if (settings) {
      setAllowedDomains(settings.allowed_email_domains || '');
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    mutation.mutate({
      allowed_email_domains: allowedDomains,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8 max-w-4xl animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-8"></div>
        <div className="h-64 bg-gray-100 dark:bg-gray-900 rounded-lg"></div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-red-500 text-center py-10">Failed to load settings.</div>;
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-8">
        System Settings
      </h1>

      <div className="bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Registration Security
        </h2>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Allowed Email Domains
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Enter a comma-separated list of domains allowed to request access (e.g., <code>company.com, example.com</code>).
              Leave blank to allow any email domain.
            </p>
            <Input
              type="text"
              value={allowedDomains}
              onChange={(e) => setAllowedDomains(e.target.value)}
              placeholder="company.com"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button type="submit" variant="primary" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
            {saveSuccess && (
              <span className="text-sm text-green-600 dark:text-green-400">
                Settings saved successfully!
              </span>
            )}
            {mutation.isError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {mutation.error.message}
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
