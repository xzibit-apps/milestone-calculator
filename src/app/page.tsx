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
    <div className="min-h-screen bg-[#0b1220] text-[#e2e8f0] font-sans relative overflow-x-hidden">
      {/* Enhanced Animated background with depth - Responsive */}
      <div className="absolute inset-0 bg-linear-to-br from-[#0b1220] via-[#1e1b4b] to-[#0b1220]"></div>
      <div className="absolute top-0 right-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] bg-[#60a5fa]/15 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 left-0 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[600px] lg:h-[600px] bg-[#3b82f6]/15 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: '1s' }}
      ></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] lg:w-[400px] lg:h-[400px] bg-[#8b5cf6]/10 rounded-full blur-3xl"></div>

      {/* Grid pattern overlay for depth - Responsive */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(96,165,250,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(96,165,250,0.03)_1px,transparent_1px)] bg-size-[30px_30px] sm:bg-size-[40px_40px] lg:bg-size-[50px_50px]"></div>

      <div className="relative max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
        <Header />

        {/* Error Message Display */}
        {errorMessage && (
          <div className="mb-4 sm:mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400 flex items-center gap-3 animate-fade-in">
            <div className="bg-red-500/20 rounded-lg p-2 shrink-0">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm sm:text-base font-medium">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-red-400 hover:text-red-300 transition-colors"
              aria-label="Close error message"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
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
