// components/home/ProjectForm.tsx
import { useRef } from 'react';
import {
  UseFormReturn,
  FieldError,
  UseFormRegisterReturn,
} from 'react-hook-form';
import { Calendar, Zap, AlertCircle } from 'lucide-react';
import { MESSAGES } from '@/lib/constants';
import type { ProjectInputFormData } from '@/lib/validation';

interface LabelsConfig {
  infoGates: Record<string, string>;
  optionalFlags: Record<string, string>;
}

interface ProjectFormProps {
  form: UseFormReturn<ProjectInputFormData>;
  onSubmit: (data: ProjectInputFormData) => void;
  isCalculating: boolean;
  labels: LabelsConfig | null;
}

interface SelectOption {
  value: string;
  label: string;
}

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
      if (typeof inputRef.current.showPicker === 'function') {
        try {
          inputRef.current.showPicker();
        } catch {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    }
  };

  const { ref, ...registerRest } = register;
  const hasIcon = Boolean(icon);

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {required && <span className="required" aria-hidden="true">*</span>}
      </label>
      <div className="input-wrap">
        <input
          id={id}
          type={type}
          {...(isDateInput ? registerRest : register)}
          ref={isDateInput ? (e) => {
            ref(e);
            inputRef.current = e;
          } : undefined}
          onClick={isDateInput ? handleDateInputClick : undefined}
          className={`input ${hasIcon ? 'input--with-icon' : ''} ${error ? 'input--error' : ''}`.trim()}
          placeholder={placeholder}
        />
        {hasIcon && (
          <span className="input-icon" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      {error && (
        <p className="field-error">
          <AlertCircle className="h-3 w-3" aria-hidden="true" />
          {error.message}
        </p>
      )}
      {helpText && !error && (
        <p className="field-help">{helpText}</p>
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
  <div className="field">
    <label htmlFor={id} className="field-label">
      {label}
      {required && <span className="required" aria-hidden="true">*</span>}
    </label>
    <select
      id={id}
      {...register}
      className={`select ${error ? 'select--error' : ''}`.trim()}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && (
      <p className="field-error">
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
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
  <label className="checkbox" htmlFor={id}>
    <input id={id} type="checkbox" {...register} />
    <span>{label}</span>
  </label>
);

export default function ProjectForm({
  form,
  onSubmit,
  isCalculating,
  labels,
}: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  return (
    <div className="card">
      <div className="card-eyebrow">Inputs</div>
      <div className="card-title">{MESSAGES.INPUTS}</div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ marginTop: 'var(--xz-s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--xz-s-4)' }}
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
          icon={<Calendar className="h-4 w-4" />}
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

        <fieldset className="fieldset">
          <div className="fieldset-title">{MESSAGES.OPTIONAL_FLAGS}</div>
          <div className="fieldset-list">
            <FormCheckbox
              id="engineeringRequired"
              label={labels?.optionalFlags?.engineeringRequired || MESSAGES.ENGINEERING_REQUIRED}
              register={register('engineeringRequired')}
            />
            <FormCheckbox
              id="longLeadItems"
              label={labels?.optionalFlags?.longLeadItems || MESSAGES.LONG_LEAD_ITEMS}
              register={register('longLeadItems')}
            />
          </div>
        </fieldset>

        <fieldset className="fieldset">
          <div className="fieldset-title">{MESSAGES.INFORMATION_GATES}</div>
          <div className="fieldset-list">
            <FormCheckbox
              id="finalDrawings"
              label={labels?.infoGates?.finalDrawings || MESSAGES.FINAL_DRAWINGS}
              register={register('infoGates.finalDrawings')}
            />
            <FormCheckbox
              id="finishesConfirmed"
              label={labels?.infoGates?.finishesConfirmed || MESSAGES.FINISHES_CONFIRMED}
              register={register('infoGates.finishesConfirmed')}
            />
            <FormCheckbox
              id="brandingAssets"
              label={labels?.infoGates?.brandingAssets || MESSAGES.BRANDING_ASSETS}
              register={register('infoGates.brandingAssets')}
            />
            <FormCheckbox
              id="avInputsConfirmed"
              label={labels?.infoGates?.avInputsConfirmed || MESSAGES.AV_INPUTS_CONFIRMED}
              register={register('infoGates.avInputsConfirmed')}
            />
            <FormCheckbox
              id="engineeringSignedOff"
              label={labels?.infoGates?.engineeringSignedOff || MESSAGES.ENGINEERING_SIGNED_OFF}
              register={register('infoGates.engineeringSignedOff')}
            />
            <FormCheckbox
              id="clientScopeApproved"
              label={labels?.infoGates?.clientScopeApproved || MESSAGES.CLIENT_SCOPE_APPROVED}
              register={register('infoGates.clientScopeApproved')}
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isCalculating}
          className="btn btn--primary"
          style={{ marginTop: 'var(--xz-s-3)', width: '100%', justifyContent: 'center' }}
        >
          {isCalculating ? (
            <>
              <span className="spinner" aria-hidden="true" />
              <span>{MESSAGES.CALCULATING}</span>
            </>
          ) : (
            <>
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>{MESSAGES.CALCULATE_MILESTONES}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
