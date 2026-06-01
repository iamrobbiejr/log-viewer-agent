import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllMachines, createMachine, updateMachine, deleteMachine } from '../api/machineApi';

export default function MachineManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    category: 'Production',
    url: '',
    secret: '',
    is_active: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin_machines'],
    queryFn: fetchAllMachines,
  });
  
  const machines = data?.data || [];

  const createMutation = useMutation({
    mutationFn: createMachine,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin_machines']);
      closeModal();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateMachine(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin_machines']);
      closeModal();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMachine,
    onSuccess: () => queryClient.invalidateQueries(['admin_machines'])
  });

  const openModal = (machine = null) => {
    if (machine) {
      setEditingMachine(machine);
      setFormData({
        name: machine.name,
        category: machine.category,
        url: machine.url,
        secret: machine.secret,
        is_active: machine.is_active,
      });
    } else {
      setEditingMachine(null);
      setFormData({
        name: '',
        category: 'Production',
        url: '',
        secret: crypto.randomUUID(), // auto-generate a secret
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMachine(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMachine) {
      updateMutation.mutate({ id: editingMachine.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Machine Management</h1>
          <p className="text-sm text-gray-500">Manage agents and their connection settings.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm text-sm"
        >
          + Add Machine
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">Loading machines...</td>
              </tr>
            ) : machines.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No machines found.</td>
              </tr>
            ) : (
              machines.map((machine) => (
                <tr key={machine.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{machine.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{machine.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{machine.url}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${machine.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {machine.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => {
                      navigator.clipboard.writeText(machine.secret);
                      alert('Secret copied to clipboard!');
                    }} className="text-gray-600 hover:text-gray-900 mr-4" title="Copy Secret">Copy Secret</button>
                    <button onClick={() => openModal(machine)} className="text-blue-600 hover:text-blue-900 mr-4">Edit</button>
                    <button 
                      onClick={() => { if(window.confirm('Are you sure you want to delete this machine?')) deleteMutation.mutate(machine.id) }} 
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4" id="modal-title">
                    {editingMachine ? 'Edit Machine' : 'Add New Machine'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Branch A - Till 1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                      <input type="text" required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Production" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent URL (Cloudflare/Ngrok Tunnel)</label>
                      <input type="url" required value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-blue-500 focus:border-blue-500" placeholder="https://store1.yourcompany.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Agent Secret (Match this in agent config.json)</label>
                      <input type="text" required value={formData.secret} onChange={e => setFormData({...formData, secret: e.target.value})} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono text-sm focus:ring-blue-500 focus:border-blue-500" />
                    </div>
                    <div className="flex items-center">
                      <input id="is_active" type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                        Active (Monitor this machine)
                      </label>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm">
                    {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
