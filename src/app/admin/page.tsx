'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Save, AlertCircle, ArrowLeft } from 'lucide-react';
import type { CIConfig } from '@/lib/calculator';
import type { TaskConfig } from '@/lib/types';
import { TIMING } from '@/lib/constants';
import tasksData from '@/config/tasks.json';
import ciConfigData from '@/config/ciConfig.json';
import labelsData from '@/config/labels.json';

interface LabelsConfig {
  infoGates: Record<string, string>;
  optionalFlags: Record<string, string>;
}

export default function AdminPage() {
  const [ciConfig, setCiConfig] = useState<CIConfig | null>(null);
  const [tasks, setTasks] = useState<TaskConfig[]>([]);
  const [labels, setLabels] = useState<LabelsConfig | null>(null);
  const [activeTab, setActiveTab] = useState<'ci' | 'thresholds' | 'tasks' | 'labels'>('ci');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMessageFading, setIsMessageFading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    const checkAdminRole = async () => {
      try {
        const response = await fetch('/api/user/role');
        if (response.ok) {
          const data = await response.json();
          const userIsAdmin = data.isAdmin === true;
          setIsAdmin(userIsAdmin);
          
          if (!userIsAdmin) {
            // Redirect to home if not admin
            window.location.href = '/';
            return;
          }
        } else {
          // Not authenticated or error
          setIsAdmin(false);
          window.location.href = '/';
          return;
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
        window.location.href = '/';
        return;
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, []);

  useEffect(() => {
    // Load configs only if admin
    if (isAdmin === true) {
      try {
        setCiConfig(ciConfigData as CIConfig);
        setTasks(tasksData as TaskConfig[]);
        setLabels(labelsData as LabelsConfig);
      } catch (error) {
        console.error('Failed to load configs:', error);
      }
    }
  }, [isAdmin]);

  const handleSave = async () => {
    if (!ciConfig || !tasks || !labels) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save all three config files
      const savePromises = [
        // Save CI Config
        fetch('/api/admin/save-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configType: 'ciConfig', data: ciConfig }),
        }),
        // Save Tasks
        fetch('/api/admin/save-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configType: 'tasks', data: tasks }),
        }),
        // Save Labels
        fetch('/api/admin/save-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ configType: 'labels', data: labels }),
        }),
      ];

      const results = await Promise.all(savePromises);
      
      // Check if all saves were successful
      const allResults = await Promise.all(
        results.map(async (response) => {
          const data = await response.json();
          return { ok: response.ok, success: data.success };
        })
      );
      
      const allSuccessful = allResults.every(result => result.ok && result.success);

      if (allSuccessful) {
        setSaveMessage({
          type: 'success',
          text: 'All configurations saved successfully! Calculator will use updated values on next calculation.',
        });
        setIsMessageFading(false);
        
        // Start fade out after configured duration, then remove after animation
        setTimeout(() => {
          setIsMessageFading(true);
          setTimeout(() => {
            setSaveMessage(null);
            setIsMessageFading(false);
          }, TIMING.FADE_ANIMATION_DURATION);
        }, TIMING.MESSAGE_DISPLAY_DURATION);
      } else {
        throw new Error('Some configurations failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage({
        type: 'error',
        text: error instanceof Error 
          ? `Failed to save: ${error.message}` 
          : 'Failed to save configuration. Please check console for details.',
      });
      setIsMessageFading(false);
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while checking admin role
  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-[#e2e8f0] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#60a5fa] mx-auto"></div>
            <p className="mt-4 text-[#94a3b8]">Checking permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-[#e2e8f0] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-red-500/20 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-[#94a3b8] mb-6">You do not have permission to access this page. Admin role required.</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-xl font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Calculator
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ciConfig || !tasks || !labels) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-[#e2e8f0] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#60a5fa] mx-auto"></div>
            <p className="mt-4 text-[#94a3b8]">Loading configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e2e8f0] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-[#203049]/60 rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center justify-center w-10 h-10 bg-[#0b2545]/50 hover:bg-[#0b2545] border border-[#203049] hover:border-[#60a5fa]/50 rounded-xl text-[#94a3b8] hover:text-[#60a5fa] transition-all duration-300 cursor-pointer group mr-2"
                title="Back to Calculator"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div className="bg-[#60a5fa]/20 rounded-lg p-2 border border-[#60a5fa]/30">
                <Settings className="h-6 w-6 text-[#60a5fa]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-[#94a3b8] mt-1">
                  Configure CI weights, thresholds, tasks, and labels
                </p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-xl border transition-all duration-300 ${
              isMessageFading
                ? 'opacity-0 translate-y-[-10px]'
                : 'opacity-100 translate-y-0'
            } ${
              saveMessage.type === 'success'
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-red-500/20 border-red-500/50 text-red-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <p>{saveMessage.text}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-[#203049]/60 rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
          <div className="flex border-b border-[#203049]">
            {[
              { id: 'ci' as const, label: 'CI Weights' },
              { id: 'thresholds' as const, label: 'CI Thresholds' },
              { id: 'tasks' as const, label: 'Tasks' },
              { id: 'labels' as const, label: 'Labels' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#60a5fa]/20 text-[#60a5fa] border-b-2 border-[#60a5fa]'
                    : 'text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#0b2545]/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* CI Weights Tab */}
            {activeTab === 'ci' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Complexity Index Weights</h2>
                
                {/* Build Type */}
                <div>
                  <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 uppercase">Build Type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(ciConfig.weights.buildType).map(([key, value]) => (
                      <div key={key} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                        <label className="block text-xs text-[#94a3b8] mb-2 capitalize">{key}</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setCiConfig({
                              ...ciConfig,
                              weights: {
                                ...ciConfig.weights,
                                buildType: { ...ciConfig.weights.buildType, [key]: newValue },
                              },
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stand Size */}
                <div>
                  <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 uppercase">Stand Size</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.standSize).map(([key, value]) => (
                      <div key={key} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                        <label className="block text-xs text-[#94a3b8] mb-2 capitalize">{key}</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setCiConfig({
                              ...ciConfig,
                              weights: {
                                ...ciConfig.weights,
                                standSize: { ...ciConfig.weights.standSize, [key]: newValue },
                              },
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* AV Complexity */}
                <div>
                  <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 uppercase">AV Complexity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.avComplexity).map(([key, value]) => (
                      <div key={key} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                        <label className="block text-xs text-[#94a3b8] mb-2 capitalize">{key}</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setCiConfig({
                              ...ciConfig,
                              weights: {
                                ...ciConfig.weights,
                                avComplexity: { ...ciConfig.weights.avComplexity, [key]: newValue },
                              },
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fabrication Intensity */}
                <div>
                  <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 uppercase">Fabrication Intensity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.fabricationIntensity).map(([key, value]) => (
                      <div key={key} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                        <label className="block text-xs text-[#94a3b8] mb-2 capitalize">{key.replace(/_/g, ' ')}</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setCiConfig({
                              ...ciConfig,
                              weights: {
                                ...ciConfig.weights,
                                fabricationIntensity: { ...ciConfig.weights.fabricationIntensity, [key]: newValue },
                              },
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brief Clarity */}
                <div>
                  <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 uppercase">Brief Clarity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.briefClarity).map(([key, value]) => (
                      <div key={key} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                        <label className="block text-xs text-[#94a3b8] mb-2 capitalize">{key.replace(/_/g, ' ')}</label>
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value) || 0;
                            setCiConfig({
                              ...ciConfig,
                              weights: {
                                ...ciConfig.weights,
                                briefClarity: { ...ciConfig.weights.briefClarity, [key]: newValue },
                              },
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engineering Required & Long Lead Items */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                    <label className="block text-xs text-[#94a3b8] mb-2">Engineering Required</label>
                    <input
                      type="number"
                      value={ciConfig.weights.engineeringRequired}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setCiConfig({
                          ...ciConfig,
                          weights: {
                            ...ciConfig.weights,
                            engineeringRequired: newValue,
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                    />
                  </div>
                  <div className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                    <label className="block text-xs text-[#94a3b8] mb-2">Long Lead Items</label>
                    <input
                      type="number"
                      value={ciConfig.weights.longLeadItems}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setCiConfig({
                          ...ciConfig,
                          weights: {
                            ...ciConfig.weights,
                            longLeadItems: newValue,
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CI Thresholds Tab */}
            {activeTab === 'thresholds' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">Complexity Index Thresholds</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-[#0b2545] rounded-lg p-6 border border-[#203049]">
                    <label className="block text-sm font-semibold text-[#94a3b8] mb-3">
                      Low Max (CI ≤ this value = Low bucket)
                    </label>
                    <input
                      type="number"
                      value={ciConfig.thresholds.lowMax}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setCiConfig({
                          ...ciConfig,
                          thresholds: {
                            ...ciConfig.thresholds,
                            lowMax: newValue,
                          },
                        });
                      }}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                    />
                  </div>
                  <div className="bg-[#0b2545] rounded-lg p-6 border border-[#203049]">
                    <label className="block text-sm font-semibold text-[#94a3b8] mb-3">
                      Medium Max (CI ≤ this value = Medium bucket)
                    </label>
                    <input
                      type="number"
                      value={ciConfig.thresholds.mediumMax}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value) || 0;
                        setCiConfig({
                          ...ciConfig,
                          thresholds: {
                            ...ciConfig.thresholds,
                            mediumMax: newValue,
                          },
                        });
                      }}
                      className="w-full px-4 py-3 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Task Configuration</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-xs text-[#94a3b8] mb-2">Task Name</label>
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, name: e.target.value };
                              setTasks(newTasks);
                            }}
                            className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#94a3b8] mb-2">Duration Low</label>
                          <input
                            type="number"
                            min="0"
                            value={task.durationLow}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, durationLow: parseInt(e.target.value) || 0 };
                              setTasks(newTasks);
                            }}
                            className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#94a3b8] mb-2">Duration Medium</label>
                          <input
                            type="number"
                            min="0"
                            value={task.durationMedium}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, durationMedium: parseInt(e.target.value) || 0 };
                              setTasks(newTasks);
                            }}
                            className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-[#94a3b8] mb-2">Duration High</label>
                          <input
                            type="number"
                            min="0"
                            value={task.durationHigh}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, durationHigh: parseInt(e.target.value) || 0 };
                              setTasks(newTasks);
                            }}
                            className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-xs text-[#94a3b8] mb-2">Success Factor</label>
                        <textarea
                          value={task.successFactor}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index] = { ...task, successFactor: e.target.value };
                            setTasks(newTasks);
                          }}
                          rows={2}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-[#94a3b8] mb-2">Scope Conditions (comma-separated)</label>
                        <input
                          type="text"
                          value={task.scopeConditions.join(', ')}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index] = {
                              ...task,
                              scopeConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                            };
                            setTasks(newTasks);
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                          placeholder="all, custom, engineered"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Labels Tab */}
            {activeTab === 'labels' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">UI Labels</h2>
                
                <div>
                  <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 uppercase">Information Gates</h3>
                  <div className="space-y-3">
                    {Object.entries(labels.infoGates).map(([key, value]) => (
                      <div key={key} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                        <label className="block text-xs text-[#94a3b8] mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            setLabels({
                              ...labels,
                              infoGates: { ...labels.infoGates, [key]: e.target.value },
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#94a3b8] mb-3 uppercase">Optional Flags</h3>
                  <div className="space-y-3">
                    {Object.entries(labels.optionalFlags).map(([key, value]) => (
                      <div key={key} className="bg-[#0b2545] rounded-lg p-4 border border-[#203049]">
                        <label className="block text-xs text-[#94a3b8] mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            setLabels({
                              ...labels,
                              optionalFlags: { ...labels.optionalFlags, [key]: e.target.value },
                            });
                          }}
                          className="w-full px-3 py-2 bg-[#0f172a] border border-[#203049] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#60a5fa]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
