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
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">
            <div className="h3">Admin</div>
          </div>
        </div>
        <div className="page">
          <div className="card" style={{ textAlign: 'center' }}>
            <span className="spinner" aria-hidden="true" />
            <p className="subtle" style={{ marginTop: 'var(--xz-s-3)' }}>
              Checking permissions…
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if not admin
  if (isAdmin === false) {
    return (
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">
            <div className="h3">Admin</div>
          </div>
        </div>
        <div className="page">
          <div className="card" style={{ textAlign: 'center' }}>
            <AlertCircle
              className="h-10 w-10"
              aria-hidden="true"
              style={{ margin: '0 auto var(--xz-s-3)', color: 'var(--xz-coral-700)' }}
            />
            <h2 className="h2">Access denied</h2>
            <p className="subtle" style={{ marginTop: 'var(--xz-s-2)' }}>
              You do not have permission to access this page. Admin role required.
            </p>
            <div style={{ marginTop: 'var(--xz-s-5)' }}>
              <Link href="/" className="btn btn--primary">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to calculator
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ciConfig || !tasks || !labels) {
    return (
      <div className="main">
        <div className="topbar">
          <div className="topbar-title">
            <div className="h3">Admin</div>
          </div>
        </div>
        <div className="page">
          <div className="card" style={{ textAlign: 'center' }}>
            <span className="spinner" aria-hidden="true" />
            <p className="subtle" style={{ marginTop: 'var(--xz-s-3)' }}>
              Loading configuration…
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main">
      <div className="topbar">
        <div className="topbar-title">
          <Link href="/" className="btn btn--ghost" title="Back to calculator">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="h3">Admin</div>
        </div>
        <div className="topbar-actions">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn--primary"
          >
            {isSaving ? (
              <>
                <span className="spinner" aria-hidden="true" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                <span>Save changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="page">
        <div className="hero">
          <div>
            <div className="step">
              <span>Settings</span>
              <span className="bar"></span>
              <span className="gray">Configuration</span>
            </div>
            <h1 className="h1">Configure calculator</h1>
            <p className="subtle">
              Tune CI weights, bucket thresholds, task definitions, and label text.
            </p>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`alert ${saveMessage.type === 'success' ? 'alert--info' : 'alert--error'} ${
              isMessageFading ? 'animate-fade-in' : ''
            }`}
            style={{ marginBottom: 'var(--xz-s-5)', opacity: isMessageFading ? 0 : 1, transition: 'opacity 0.3s ease' }}
            role="status"
          >
            <span className="alert-icon" aria-hidden="true">
              <AlertCircle className="h-4 w-4" />
            </span>
            <div className="alert-body">
              <div className="alert-title">
                {saveMessage.type === 'success' ? 'Saved' : 'Save failed'}
              </div>
              <div className="alert-text">{saveMessage.text}</div>
            </div>
          </div>
        )}

        <div className="card">
          <div className="tabs-block" role="tablist">
            {[
              { id: 'ci' as const, label: 'CI weights' },
              { id: 'thresholds' as const, label: 'CI thresholds' },
              { id: 'tasks' as const, label: 'Tasks' },
              { id: 'labels' as const, label: 'Labels' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab ${activeTab === tab.id ? 'is-active' : ''}`.trim()}
                role="tab"
                aria-selected={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ paddingTop: 'var(--xz-s-5)' }}>
            {/* CI Weights Tab */}
            {activeTab === 'ci' && (
              <div className="space-y-6">
                <h2 className="h2">Complexity index weights</h2>
                
                {/* Build Type */}
                <div>
                  <h3 className="h3">Build type</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(ciConfig.weights.buildType).map(([key, value]) => (
                      <div key={key} className="field">
                        <label className="field-label capitalize">{key}</label>
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
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stand Size */}
                <div>
                  <h3 className="h3">Stand size</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.standSize).map(([key, value]) => (
                      <div key={key} className="field">
                        <label className="field-label capitalize">{key}</label>
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
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* AV Complexity */}
                <div>
                  <h3 className="h3">AV complexity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.avComplexity).map(([key, value]) => (
                      <div key={key} className="field">
                        <label className="field-label capitalize">{key}</label>
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
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fabrication Intensity */}
                <div>
                  <h3 className="h3">Fabrication intensity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.fabricationIntensity).map(([key, value]) => (
                      <div key={key} className="field">
                        <label className="field-label capitalize">{key.replace(/_/g, ' ')}</label>
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
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brief Clarity */}
                <div>
                  <h3 className="h3">Brief clarity</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(ciConfig.weights.briefClarity).map(([key, value]) => (
                      <div key={key} className="field">
                        <label className="field-label capitalize">{key.replace(/_/g, ' ')}</label>
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
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Engineering Required & Long Lead Items */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label className="field-label">Engineering required</label>
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
                      className="input"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Long-lead items</label>
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
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CI Thresholds Tab */}
            {activeTab === 'thresholds' && (
              <div className="space-y-6">
                <h2 className="h2">Complexity index thresholds</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="field">
                    <label className="field-label">
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
                      className="input"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">
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
                      className="input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-4">
                <h2 className="h2">Task configuration</h2>
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="field">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="field-label">Task Name</label>
                          <input
                            type="text"
                            value={task.name}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, name: e.target.value };
                              setTasks(newTasks);
                            }}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="field-label">Duration Low</label>
                          <input
                            type="number"
                            min="0"
                            value={task.durationLow}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, durationLow: parseInt(e.target.value) || 0 };
                              setTasks(newTasks);
                            }}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="field-label">Duration Medium</label>
                          <input
                            type="number"
                            min="0"
                            value={task.durationMedium}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, durationMedium: parseInt(e.target.value) || 0 };
                              setTasks(newTasks);
                            }}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="field-label">Duration High</label>
                          <input
                            type="number"
                            min="0"
                            value={task.durationHigh}
                            onChange={(e) => {
                              const newTasks = [...tasks];
                              newTasks[index] = { ...task, durationHigh: parseInt(e.target.value) || 0 };
                              setTasks(newTasks);
                            }}
                            className="input"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="field-label">Success Factor</label>
                        <textarea
                          value={task.successFactor}
                          onChange={(e) => {
                            const newTasks = [...tasks];
                            newTasks[index] = { ...task, successFactor: e.target.value };
                            setTasks(newTasks);
                          }}
                          rows={2}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="field-label">Scope Conditions (comma-separated)</label>
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
                          className="input"
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
                <h2 className="h2">UI labels</h2>
                
                <div>
                  <h3 className="h3">Information gates</h3>
                  <div className="space-y-3">
                    {Object.entries(labels.infoGates).map(([key, value]) => (
                      <div key={key} className="field">
                        <label className="field-label capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            setLabels({
                              ...labels,
                              infoGates: { ...labels.infoGates, [key]: e.target.value },
                            });
                          }}
                          className="input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="h3">Optional flags</h3>
                  <div className="space-y-3">
                    {Object.entries(labels.optionalFlags).map(([key, value]) => (
                      <div key={key} className="field">
                        <label className="field-label capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => {
                            setLabels({
                              ...labels,
                              optionalFlags: { ...labels.optionalFlags, [key]: e.target.value },
                            });
                          }}
                          className="input"
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
