import React, { useState, useEffect } from 'react';
import { Shield, Plus, Trash2, Mail, CheckCircle, XCircle, AlertCircle, UserCheck } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Whitelist = () => {
  const { user } = useAuth();
  const [whitelistedEmails, setWhitelistedEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm();

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const fetchWhitelist = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getWhitelist();
      setWhitelistedEmails(response.data.whitelistedEmails || []);
    } catch (error) {
      console.error('Error fetching whitelist:', error);
      toast.error('Failed to load whitelist');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setIsAdding(true);
      await adminAPI.addToWhitelist(newEmail);
      toast.success('Email added to whitelist successfully!');
      setNewEmail('');
      fetchWhitelist();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add email to whitelist';
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveEmail = async (id, email) => {
    await showConfirm({
      title: "Remove from Whitelist",
      message: `Are you sure you want to remove "${email}" from the whitelist? This will prevent new registrations with this email.`,
      confirmText: "Remove",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await adminAPI.removeFromWhitelist(id);
          toast.success('Email removed from whitelist');
          fetchWhitelist();
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to remove email';
          toast.error(message);
        }
      }
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const usedEmails = whitelistedEmails.filter(e => e.isUsed);
  const availableEmails = whitelistedEmails.filter(e => !e.isUsed);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3 text-blue-600" size={32} />
            Email Whitelist
          </h1>
          <p className="text-gray-600 mt-1">Control who can register for an account</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="floating-card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Whitelisted</p>
              <p className="text-2xl font-bold text-gray-900">{whitelistedEmails.length}</p>
            </div>
          </div>
        </div>

        <div className="floating-card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Registered</p>
              <p className="text-2xl font-bold text-gray-900">{usedEmails.length}</p>
            </div>
          </div>
        </div>

        <div className="floating-card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserCheck className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{availableEmails.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Email Form */}
      <div className="floating-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="mr-2 text-green-600" size={24} />
          Add Email to Whitelist
        </h2>

        <form onSubmit={handleAddEmail} className="flex gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter email address..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isAdding}
            />
          </div>
          <button
            type="submit"
            disabled={isAdding}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isAdding ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Adding...
              </>
            ) : (
              <>
                <Shield className="mr-2" size={16} />
                Whitelist
              </>
            )}
          </button>
        </form>

        <p className="text-sm text-gray-500 mt-3">
          Only whitelisted email addresses will be able to create new accounts.
        </p>
      </div>

      {/* Whitelisted Emails List */}
      <div className="floating-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Whitelisted Emails ({whitelistedEmails.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Added By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Added
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {whitelistedEmails.map((entry) => (
                <tr key={entry._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-2" size={16} />
                      <span className="text-sm font-medium text-gray-900">{entry.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {entry.isUsed ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle size={12} className="mr-1" />
                        Registered
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                        <UserCheck size={12} className="mr-1" />
                        Available
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.addedBy?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(entry.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {!entry.isUsed ? (
                      <button
                        onClick={() => handleRemoveEmail(entry._id, entry.email)}
                        className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Remove from whitelist"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs flex items-center">
                        <XCircle size={12} className="mr-1" />
                        Cannot remove
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {whitelistedEmails.length === 0 && (
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Whitelisted Emails</h3>
            <p className="text-gray-500">Add email addresses to allow new user registrations.</p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={hideConfirm}
        onConfirm={handleConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
        isLoading={confirmState.isLoading}
      />
    </div>
  );
};

export default Whitelist;
