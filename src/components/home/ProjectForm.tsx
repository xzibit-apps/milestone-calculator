// components/home/ProjectForm.tsx
import { useRef } from 'react';
import {
  UseFormReturn,
  FieldError,
  UseFormRegisterReturn,
} from 'react-hook-form';
import { Target, Calendar, Zap, AlertCircle } from 'lucide-react';
import { MESSAGES } from '@/lib/constants';
import type { ProjectInputFormData } from '@/lib/validation';

interface ProjectFormProps {
  form: UseFormReturn<ProjectInputFormData>;
  onSubmit: (data: ProjectInputFormData) => void;
  isCalculating: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

// Move components outside to prevent re-creation on every render
const FormInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  register,
  error,
  helpText,
  icon,
  required = false,
}: {
  id: string;
  label: string;
  type?: 'text' | 'date' | 'email' | 'number';
  placeholder?: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  helpText?: string;
  icon?: React.ReactNode;
  required?: boolean;
}) => {
  const isDateInput = type === 'date';
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDateInputClick = () => {
    if (isDateInput && inputRef.current) {
      // showPicker must be called directly from user gesture, not in setTimeout
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch {
          // If showPicker fails, just focus the input (native date picker will open on focus)
          inputRef.current.focus();
        }
      } else {
        // Fallback: just focus
        inputRef.current.focus();
      }
    }
  };

  // Merge refs properly
  const { ref, ...registerRest } = register;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs text-[#94a3b8] mb-2 uppercase tracking-wide"
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {isDateInput && icon ? (
          <>
            <input
              id={id}
              type={type}
              {...registerRest}
              ref={(e) => {
                ref(e);
                inputRef.current = e;
              }}
              onClick={handleDateInputClick}
              className={`w-full pl-3 pr-10 sm:pl-4 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base bg-[#0b1a2e]/90 backdrop-blur-md border rounded-lg sm:rounded-xl text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/50 focus:border-[#60a5fa] focus:bg-[#0b1a2e] focus:shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:border-[#60a5fa]/50 transition-all duration-300 cursor-pointer ${
                error ? 'border-red-500/50' : 'border-[#203049]/80'
              }`}
              placeholder={placeholder}
            />
            <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
          </>
        ) : (
          <>
            {icon && (
              <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                {icon}
              </div>
            )}
            <input
              id={id}
              type={type}
              {...register}
              className={`w-full ${
                icon ? 'pl-10 sm:pl-12' : 'pl-3 sm:pl-4'
              } pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#0b1a2e]/90 backdrop-blur-md border rounded-lg sm:rounded-xl text-[#e2e8f0] placeholder:text-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/50 focus:border-[#60a5fa] focus:bg-[#0b1a2e] focus:shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:border-[#60a5fa]/50 transition-all duration-300 ${
                error ? 'border-red-500/50' : 'border-[#203049]/80'
              }`}
              placeholder={placeholder}
            />
          </>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error.message}
        </p>
      )}
      {helpText && !error && (
        <p className="mt-2 text-xs text-[#64748b]">{helpText}</p>
      )}
    </div>
  );
};

const FormSelect = ({
  id,
  label,
  register,
  error,
  options,
  required = false,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  options: SelectOption[];
  required?: boolean;
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-xs text-[#94a3b8] mb-2 uppercase tracking-wide"
    >
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <select
      id={id}
      {...register}
      className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-[#0b1a2e]/90 backdrop-blur-md border rounded-lg sm:rounded-xl text-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/50 focus:border-[#60a5fa] focus:bg-[#0b1a2e] focus:shadow-[0_0_20px_rgba(96,165,250,0.3)] hover:border-[#60a5fa]/50 transition-all duration-300 cursor-pointer ${
        error ? 'border-red-500/50' : 'border-[#203049]/80'
      }`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {error.message}
      </p>
    )}
  </div>
);

const FormCheckbox = ({
  id,
  label,
  register,
}: {
  id: string;
  label: string;
  register: UseFormRegisterReturn;
}) => (
  <label className="flex items-center cursor-pointer group">
    <input
      id={id}
      type="checkbox"
      {...register}
      className="h-4 w-4 text-[#60a5fa] border-[#203049] rounded bg-[#0b1a2e] focus:ring-2 focus:ring-[#60a5fa] cursor-pointer"
    />
    <span className="ml-3 text-sm text-[#e2e8f0] group-hover:text-[#60a5fa] transition-colors">
      {label}
    </span>
  </label>
);

export default function ProjectForm({
  form,
  onSubmit,
  isCalculating,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="bg-[#0f172a]/90 backdrop-blur-2xl border border-[#203049]/60 rounded-2xl sm:rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_12px_48px_rgba(96,165,250,0.15)] transition-all duration-700 relative overflow-hidden group">
      <div className="absolute inset-0 bg-linear-to-br from-[#60a5fa]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

      <div className="p-4 sm:p-6 lg:p-8 border-b border-[#203049]/50 bg-linear-to-r from-[#0f172a]/95 to-[#1e293b]/95 backdrop-blur-sm relative z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-[#60a5fa]/20 rounded-lg p-1.5 sm:p-2 border border-[#60a5fa]/30">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-[#60a5fa]" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            {MESSAGES.INPUTS}
          </h2>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 relative z-10"
      >
        <FormInput
          id="projectName"
          label={MESSAGES.PROJECT_NAME}
          type="text"
          placeholder={MESSAGES.PROJECT_NAME_PLACEHOLDER}
          register={register('projectName')}
          error={errors.projectName}
          required
        />

        <FormInput
          id="clientName"
          label={MESSAGES.CLIENT_NAME}
          type="text"
          placeholder={MESSAGES.CLIENT_NAME_PLACEHOLDER}
          register={register('clientName')}
          error={errors.clientName}
          required
        />

        <FormInput
          id="truckLeaveDate"
          label={MESSAGES.TRUCK_LEAVE_DATE}
          type="date"
          register={register('truckLeaveDate')}
          error={errors.truckLeaveDate}
          helpText={MESSAGES.TRUCK_LEAVE_DATE_HELP}
          icon={<Calendar className="h-5 w-5" />}
        />

        <FormSelect
          id="buildType"
          label={MESSAGES.BUILD_TYPE}
          register={register('buildType')}
          error={errors.buildType}
          required
          options={[
            { value: 'hire', label: MESSAGES.BUILD_HIRE },
            { value: 'hybrid', label: MESSAGES.BUILD_HYBRID },
            { value: 'custom', label: MESSAGES.BUILD_CUSTOM },
            { value: 'engineered', label: MESSAGES.BUILD_ENGINEERED },
          ]}
        />

        <FormSelect
          id="standSize"
          label={MESSAGES.STAND_SIZE}
          register={register('standSize')}
          error={errors.standSize}
          required
          options={[
            { value: 'small', label: MESSAGES.STAND_SMALL },
            { value: 'medium', label: MESSAGES.STAND_MEDIUM },
            { value: 'large', label: MESSAGES.STAND_LARGE },
          ]}
        />

        <FormSelect
          id="avComplexity"
          label={MESSAGES.AV_COMPLEXITY}
          register={register('avComplexity')}
          error={errors.avComplexity}
          required
          options={[
            { value: 'basic', label: MESSAGES.AV_BASIC },
            { value: 'medium', label: MESSAGES.AV_MEDIUM },
            { value: 'high', label: MESSAGES.AV_HIGH },
          ]}
        />

        <FormSelect
          id="fabricationIntensity"
          label={MESSAGES.FABRICATION_INTENSITY}
          register={register('fabricationIntensity')}
          error={errors.fabricationIntensity}
          required
          options={[
            { value: 'standard', label: MESSAGES.FAB_STANDARD },
            { value: 'some_custom', label: MESSAGES.FAB_SOME_CUSTOM },
            { value: 'heavy_custom', label: MESSAGES.FAB_HEAVY_CUSTOM },
          ]}
        />

        <FormSelect
          id="briefClarity"
          label={MESSAGES.BRIEF_CLARITY}
          register={register('briefClarity')}
          error={errors.briefClarity}
          required
          options={[
            { value: 'clear', label: MESSAGES.BRIEF_CLEAR },
            { value: 'some_unknowns', label: MESSAGES.BRIEF_SOME_UNKNOWNS },
            { value: 'vague', label: MESSAGES.BRIEF_VAGUE },
          ]}
        />

        <div className="pt-4 border-t border-[#203049]">
          <h3 className="text-xs text-[#94a3b8] mb-3 uppercase tracking-wide">
            {MESSAGES.OPTIONAL_FLAGS}
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <FormCheckbox
              id="engineeringRequired"
              label={MESSAGES.ENGINEERING_REQUIRED}
              register={register('engineeringRequired')}
            />
            <FormCheckbox
              id="longLeadItems"
              label={MESSAGES.LONG_LEAD_ITEMS}
              register={register('longLeadItems')}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#203049]">
          <h3 className="text-xs text-[#94a3b8] mb-3 uppercase tracking-wide">
            {MESSAGES.INFORMATION_GATES}
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <FormCheckbox
              id="finalDrawings"
              label={MESSAGES.FINAL_DRAWINGS}
              register={register('infoGates.finalDrawings')}
            />
            <FormCheckbox
              id="finishesConfirmed"
              label={MESSAGES.FINISHES_CONFIRMED}
              register={register('infoGates.finishesConfirmed')}
            />
            <FormCheckbox
              id="brandingAssets"
              label={MESSAGES.BRANDING_ASSETS}
              register={register('infoGates.brandingAssets')}
            />
            <FormCheckbox
              id="avInputsConfirmed"
              label={MESSAGES.AV_INPUTS_CONFIRMED}
              register={register('infoGates.avInputsConfirmed')}
            />
            <FormCheckbox
              id="engineeringSignedOff"
              label={MESSAGES.ENGINEERING_SIGNED_OFF}
              register={register('infoGates.engineeringSignedOff')}
            />
            <FormCheckbox
              id="clientScopeApproved"
              label={MESSAGES.CLIENT_SCOPE_APPROVED}
              register={register('infoGates.clientScopeApproved')}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isCalculating}
          className="w-full bg-linear-to-r from-[#60a5fa] via-[#3b82f6] to-[#2563eb] hover:from-[#3b82f6] hover:via-[#2563eb] hover:to-[#1d4ed8] disabled:from-[#475569] disabled:via-[#334155] disabled:to-[#1e293b] text-white font-bold py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base rounded-xl sm:rounded-2xl transition-all duration-300 shadow-[0_4px_20px_rgba(96,165,250,0.4)] hover:shadow-[0_6px_30px_rgba(96,165,250,0.6)] hover:-translate-y-0.5 active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:shadow-none relative overflow-hidden group mt-6 sm:mt-8"
        >
          <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          {isCalculating ? (
            <span className="flex items-center justify-center gap-2.5 relative z-10">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>{MESSAGES.CALCULATING}</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2.5 relative z-10">
              <Zap className="h-5 w-5 group-hover:rotate-12 transition-transform" />
              <span>{MESSAGES.CALCULATE_MILESTONES}</span>
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
