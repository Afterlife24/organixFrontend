import React, { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Mail, Clock, CheckCircle, XCircle, AlertCircle, Copy } from 'lucide-react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const ResetCodes = () => {
  const { user } = useAuth();
  const [resetCodes, setResetCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { confirmState, showConfirm, hideConfirm, handleConfirm } = useConfirm();

  useEffect(() => {
    fetchResetCodes();
  }, []);

  const fetchResetCodes = async () => {
    try {
      setIsLoading(true);
      const response = await adminAPI.getResetCodes();
      setResetCodes(response.data.resetCodes || []);
    } catch (error) {
      console.error('Error fetching reset codes:', error);
      toast.error('Failed to load reset codes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateCode = async (e) => {
    e.preventDefault();
    
    if (!userEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setIsGenerating(true);
      const response = await adminAPI.generateResetCode(userEmail);
      toast.success(`Reset code generated: ${response.data.resetCode.code}`);
      setUserEmail('');
      fetchResetCodes();
      
      // Copy code to clipboard
      navigator.clipboard.writeText(response.data.resetCode.code);
      toast.success('Code copied to clipboard!', { icon: '📋' });
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate reset code';
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCode = async (id, code) => {
    await showConfirm({
      title: "Delete Reset Code",
      message: `Are you sure you want to delete reset code "${code}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await adminAPI.deleteResetCode(id);
          toast.success('Reset code deleted');
          fetchResetCodes();
        } catch (error) {
          const message = error.response?.data?.message || 'Failed to delete reset code';
          toast.error(message);
        }
      }
    });
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!', { icon: '📋' });
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

  const isExpired = (expiresAt) => {
    return new Date(expiresAt) < new Date();
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

  const activeCode = resetCodes.filter(c => !c.isUsed && !isExpired(c.expiresAt));
  const usedCodes = resetCodes.filter(c => c.isUsed);
  const expiredCodes = resetCodes.filter(c => !c.isUsed && isExpired(c.expiresAt));

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <Key className="mr-3 text-blue-600" size={32} />
            Password Reset Codes
          </h1>
          <p className="text-gray-600 mt-1">Generate access codes for password resets</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="floating-card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Codes</p>
              <p className="text-2xl font-bold text-gray-900">{activeCode.length}</p>
            </div>
          </div>
        </div>

        <div className="floating-card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Key className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Used Codes</p>
              <p className="text-2xl font-bold text-gray-900">{usedCodes.length}</p>
            </div>
          </div>
        </div>

        <div className="floating-card p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Clock className="text-red-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Expired Codes</p>
              <p className="text-2xl font-bold text-gray-900">{expiredCodes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Code Form */}
      <div className="floating-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Plus className="mr-2 text-green-600" size={24} />
          Generate Reset Code
        </h2>

        <form onSubmit={handleGenerateCode} className="flex gap-3">
          <div className="flex-1">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Enter user's email address..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isGenerating}
            />
          </div>
          <button
            type="submit"
            disabled={isGenerating}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Key className="mr-2" size={16} />
                Generate Code
              </>
            )}
          </button>
        </form>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Generated codes are valid for 24 hours and can only be used once. 
            Share the code with the user to reset their password.
          </p>
        </div>
      </div>

      {/* Reset Codes List */}
      <div className="floating-card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Reset Codes ({resetCodes.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {resetCodes.map((code) => (
                <tr key={code._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-lg font-mono font-bold text-gray-900">{code.code}</span>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="ml-2 p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                        title="Copy code"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Mail className="text-gray-400 mr-2" size={14} />
                      <span className="text-sm text-gray-900">{code.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {code.isUsed ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        <CheckCircle size={12} className="mr-1" />
                        Used
                      </span>
                    ) : isExpired(code.expiresAt) ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <XCircle size={12} className="mr-1" />
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <Clock size={12} className="mr-1" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(code.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(code.expiresAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleDeleteCode(code._id, code.code)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      title="Delete code"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {resetCodes.length === 0 && (
          <div className="text-center py-12">
            <Key size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Reset Codes</h3>
            <p className="text-gray-500">Generate a reset code to help users recover their passwords.</p>
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

export default ResetCodes;
