'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { runCalculation } from '@/lib/calculator';
import {
  projectInputSchema,
  type ProjectInputFormData,
} from '@/lib/validation';
import type { ProjectInput, CalculationResult } from '@/lib/types';
import Header from '@/components/home/Header';
import ProjectForm from '@/components/home/ProjectForm';
import ResultsPanel from '@/components/home/ResultsPanel';

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

export default function Home() {
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [formInput, setFormInput] = useState<ProjectInput | null>(null);

  const form = useForm<ProjectInputFormData>({
    resolver: zodResolver(projectInputSchema),
    defaultValues,
    mode: 'onChange',
  });

  const watchedValues = form.watch();

  const onSubmit = (data: ProjectInputFormData) => {
    setIsCalculating(true);
    // Convert form data to ProjectInput format
    const input: ProjectInput = {
      ...data,
      truckLeaveDate: data.truckLeaveDate || null,
    };

    setFormInput(input);

    setTimeout(() => {
      const calculation = runCalculation(input);
      console.log(input);
      setResult(calculation);
      setIsCalculating(false);
    }, 300);
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          <ProjectForm
            form={form}
            onSubmit={onSubmit}
            isCalculating={isCalculating}
          />

          <ResultsPanel result={result} input={currentInput} />
        </div>
      </div>
    </div>
  );
}
