'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { runCalculation, type CIConfig } from '@/lib/calculator';
import {
  projectInputSchema,
  type ProjectInputFormData,
} from '@/lib/validation';
import { MESSAGES, TIMING } from '@/lib/constants';
import type { ProjectInput, CalculationResult, TaskConfig } from '@/lib/types';
import Header from '@/components/home/Header';
import ProjectForm from '@/components/home/ProjectForm';
import ResultsPanel from '@/components/home/ResultsPanel';
import tasksData from '@/config/tasks.json';
import ciConfigData from '@/config/ciConfig.json';
import labelsData from '@/config/labels.json';

const defaultValues: ProjectInputFormData = {
  projectName: '',
  clientName: '',
  truckLeaveDate: null,
  buildType: 'hire',
  standSize: 'small',
  avComplexity: 'basic',
  fabricationIntensity: 'standard',
  briefClarity: 'clear',
  engineeringRequired: false,
  longLeadItems: false,
  infoGates: {
    finalDrawings: false,
    finishesConfirmed: false,
    brandingAssets: false,
    avInputsConfirmed: false,
    engineeringSignedOff: false,
    clientScopeApproved: false,
  },
};

interface LabelsConfig {
  infoGates: Record<string, string>;
  optionalFlags: Record<string, string>;
}

export default function Home() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [formInput, setFormInput] = useState<ProjectInput | null>(null);
  const [ciConfig, setCiConfig] = useState<CIConfig | null>(null);
  const [labels, setLabels] = useState<LabelsConfig | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<ProjectInputFormData>({
    resolver: zodResolver(projectInputSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedValues = form.watch();

  // Load CI config and labels on mount
  useEffect(() => {
    try {
      const config = ciConfigData as CIConfig;
      setCiConfig(config);
    } catch (error) {
      console.error('Failed to load CI config:', error);
    }
    
    try {
      const labelsConfig = labelsData as LabelsConfig;
      setLabels(labelsConfig);
    } catch (error) {
      console.error('Failed to load labels:', error);
    }
  }, []);

  const onSubmit = async (data: ProjectInputFormData) => {
    if (!ciConfig) {
      setErrorMessage(MESSAGES.ERROR_CONFIG_NOT_LOADED);
      setTimeout(() => setErrorMessage(null), TIMING.MESSAGE_DISPLAY_DURATION);
      return;
    }

    setIsCalculating(true);
    setErrorMessage(null);
    
    // Convert form data to ProjectInput format
    const input: ProjectInput = {
      ...data,
      truckLeaveDate: data.truckLeaveDate || null,
    };

    setFormInput(input);

    // Small delay for smooth UX, then calculate
    await new Promise(resolve => setTimeout(resolve, TIMING.CALCULATION_DELAY));

    try {
      const tasks = tasksData as TaskConfig[];
      const calculation = runCalculation(input, tasks, ciConfig);
      setResult(calculation);
      setErrorMessage(null);
    } catch (error) {
      console.error('Calculation error:', error);
      
      // Show user-friendly error message
      let errorMsg: string = MESSAGES.ERROR_CALCULATION_FAILED;
      if (error instanceof Error) {
        if (error.message.includes('Truck leave date cannot be in the past')) {
          errorMsg = MESSAGES.ERROR_INVALID_TRUCK_DATE;
        } else {
          // Include error details for debugging (user-friendly message)
          errorMsg = `${MESSAGES.ERROR_CALCULATION_FAILED} Details: ${error.message}`;
        }
      }
      
      setErrorMessage(errorMsg);
      setResult(null);
      
      // Auto-hide error message after duration
      setTimeout(() => setErrorMessage(null), TIMING.MESSAGE_DISPLAY_DURATION);
    } finally {
      setIsCalculating(false);
    }
  };

  // Get current input from form state for export buttons
  const currentInput: ProjectInput = formInput || {
    ...watchedValues,
    truckLeaveDate: watchedValues.truckLeaveDate || null,
  };

  return (
    <div className="main">
      <Header />
      <div className="page">
        <div className="hero">
          <div>
            <div className="step">
              <span>Step 1</span>
              <span className="bar"></span>
              <span className="gray">Schedule</span>
            </div>
            <h1 className="h1">Milestone calculator</h1>
            <p className="subtle">
              Generate an accurate project schedule from the truck leave date,
              working backwards through every milestone.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="alert alert--error animate-fade-in" role="alert" style={{ marginBottom: 'var(--xz-s-5)' }}>
            <span className="alert-icon" aria-hidden="true">!</span>
            <div className="alert-body">
              <div className="alert-title">Calculation error</div>
              <div className="alert-text">{errorMessage}</div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="dismiss"
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <ProjectForm
            form={form}
            onSubmit={onSubmit}
            isCalculating={isCalculating}
            labels={labels}
          />

          <ResultsPanel result={result} input={currentInput} />
        </div>
      </div>
    </div>
  );
}
