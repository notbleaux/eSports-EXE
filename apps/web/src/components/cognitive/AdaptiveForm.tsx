/** [Ver001.000]
 * AdaptiveForm Component
 * ======================
 * Form that adapts to user based on cognitive load and preferences.
 * 
 * Features:
 * - Dynamic field visibility based on load
 * - Smart defaults and auto-fill
 * - Progressive disclosure
 * - Validation complexity adjustment
 * - Context-aware help
 * 
 * Integration:
 * - Uses TL-A3-3-A cognitive load detector
 * - Works with all form components
 * - Connects to preference learning system
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
  type ChangeEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CognitiveLoadLevel, CognitiveLoadState } from '../../lib/cognitive/types';
import { useCognitiveLoad } from '../../hooks/useCognitiveLoad';
import { 
  getLayoutConfigForLoad, 
  type LayoutModeConfig 
} from '../../lib/cognitive/adaptive/layout';
import {
  getSmartDefault,
  recordDefaultUsed,
  type FieldContext,
} from '../../lib/cognitive/adaptive/defaults';
import {
  buildContext,
  getGlobalStore,
} from '../../lib/cognitive/adaptive/learning';

// ============================================================================
// Types
// ============================================================================

/**
 * Form field configuration
 */
export interface AdaptiveFieldConfig {
  /** Field identifier */
  id: string;
  /** Field type */
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'hidden';
  /** Field label */
  label: string;
  /** Field description/help text */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Validation rules */
  validation?: ValidationRule[];
  /** Field options (for select/radio) */
  options?: Array<{ value: string; label: string }>;
  /** Default value */
  defaultValue?: unknown;
  /** Placeholder text */
  placeholder?: string;
  /** Field priority (for progressive disclosure) */
  priority: number;
  /** When to show this field based on load */
  showAt: 'always' | 'low' | 'medium' | 'high' | 'critical';
  /** Whether field can be auto-filled */
  allowAutoFill: boolean;
  /** Field category for preferences */
  category?: string;
  /** Dependencies on other fields */
  dependencies?: Array<{
    fieldId: string;
    operator: 'eq' | 'neq' | 'exists' | 'empty';
    value?: unknown;
  }>;
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule type */
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  /** Error message */
  message: string;
  /** Rule value (for minLength, maxLength, pattern) */
  value?: number | string | RegExp;
  /** Custom validator function */
  validator?: (value: unknown) => boolean;
}

/**
 * Form validation mode
 */
export type ValidationMode = 'onSubmit' | 'onBlur' | 'onChange' | 'adaptive';

/**
 * Adaptive form configuration
 */
export interface AdaptiveFormConfig {
  /** Form fields */
  fields: AdaptiveFieldConfig[];
  /** Validation mode */
  validationMode: ValidationMode;
  /** Whether to enable auto-fill */
  enableAutoFill: boolean;
  /** Whether to use smart defaults */
  useSmartDefaults: boolean;
  /** Whether to learn from user behavior */
  enableLearning: boolean;
  /** Form sections for progressive disclosure */
  sections?: Array<{
    id: string;
    title: string;
    fieldIds: string[];
    showAt: 'always' | 'low' | 'medium' | 'high';
    collapsible: boolean;
  }>;
}

/**
 * Form state
 */
export interface FormState {
  /** Field values */
  values: Record<string, unknown>;
  /** Field errors */
  errors: Record<string, string[]>;
  /** Touched fields */
  touched: Set<string>;
  /** Dirty fields */
  dirty: Set<string>;
  /** Submit count */
  submitCount: number;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Whether form is valid */
  isValid: boolean;
}

/**
 * Adaptive form context value
 */
interface AdaptiveFormContextValue {
  /** Current form state */
  state: FormState;
  /** Cognitive load state */
  cognitiveState: CognitiveLoadState;
  /** Current layout config */
  layout: LayoutModeConfig;
  /** Visible fields based on load */
  visibleFields: AdaptiveFieldConfig[];
  /** Field visibility map */
  fieldVisibility: Map<string, boolean>;
  /** Set field value */
  setFieldValue: (fieldId: string, value: unknown) => void;
  /** Mark field as touched */
  setFieldTouched: (fieldId: string, touched?: boolean) => void;
  /** Validate a field */
  validateField: (fieldId: string) => string[];
  /** Validate all fields */
  validateAll: () => boolean;
  /** Reset form */
  resetForm: () => void;
  /** Submit form */
  submitForm: () => void;
  /** Get field error */
  getFieldError: (fieldId: string) => string[];
  /** Whether field is visible */
  isFieldVisible: (fieldId: string) => boolean;
  /** Whether field is required */
  isFieldRequired: (fieldId: string) => boolean;
  /** Smart default for field */
  getFieldDefault: (fieldId: string) => unknown;
}

// ============================================================================
// Context
// ============================================================================

const AdaptiveFormContext = createContext<AdaptiveFormContextValue | null>(null);

/**
 * Hook to use adaptive form context
 */
export function useAdaptiveForm(): AdaptiveFormContextValue {
  const context = useContext(AdaptiveFormContext);
  if (!context) {
    throw new Error('useAdaptiveForm must be used within AdaptiveFormProvider');
  }
  return context;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if field should be visible based on cognitive load
 */
function shouldShowField(
  field: AdaptiveFieldConfig,
  loadLevel: CognitiveLoadLevel,
  values: Record<string, unknown>
): boolean {
  // Check load-based visibility
  const loadLevels: CognitiveLoadLevel[] = ['low', 'medium', 'high', 'critical'];
  const fieldIndex = loadLevels.indexOf(
    field.showAt === 'always' ? 'low' : field.showAt
  );
  const currentIndex = loadLevels.indexOf(loadLevel);

  if (currentIndex > fieldIndex) {
    return false;
  }

  // Check dependencies
  if (field.dependencies) {
    for (const dep of field.dependencies) {
      const depValue = values[dep.fieldId];
      
      switch (dep.operator) {
        case 'eq':
          if (depValue !== dep.value) return false;
          break;
        case 'neq':
          if (depValue === dep.value) return false;
          break;
        case 'exists':
          if (depValue === undefined || depValue === null || depValue === '') return false;
          break;
        case 'empty':
          if (depValue !== undefined && depValue !== null && depValue !== '') return false;
          break;
      }
    }
  }

  return true;
}

/**
 * Validate a field value
 */
function validateFieldValue(
  value: unknown,
  rules: ValidationRule[],
  loadLevel: CognitiveLoadLevel
): string[] {
  const errors: string[] = [];

  // Adjust validation based on load
  const strictness = {
    low: 1,
    medium: 0.8,
    high: 0.6,
    critical: 0.4,
  }[loadLevel];

  for (const rule of rules) {
    let isValid = true;

    switch (rule.type) {
      case 'required':
        isValid = value !== undefined && value !== null && value !== '';
        break;
      case 'email':
        if (typeof value === 'string') {
          isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        }
        break;
      case 'minLength':
        if (typeof value === 'string' && typeof rule.value === 'number') {
          isValid = value.length >= rule.value * strictness;
        }
        break;
      case 'maxLength':
        if (typeof value === 'string' && typeof rule.value === 'number') {
          isValid = value.length <= rule.value;
        }
        break;
      case 'pattern':
        if (typeof value === 'string') {
          const pattern = rule.value instanceof RegExp 
            ? rule.value 
            : new RegExp(rule.value as string);
          isValid = pattern.test(value);
        }
        break;
      case 'custom':
        if (rule.validator) {
          isValid = rule.validator(value);
        }
        break;
    }

    if (!isValid) {
      errors.push(rule.message);
    }
  }

  return errors;
}

/**
 * Get validation mode based on load
 */
function getAdaptiveValidationMode(loadLevel: CognitiveLoadLevel): ValidationMode {
  switch (loadLevel) {
    case 'low':
      return 'onBlur';
    case 'medium':
      return 'onChange';
    case 'high':
    case 'critical':
      return 'onSubmit'; // Less interruption during high load
    default:
      return 'onBlur';
  }
}

// ============================================================================
// Provider Component
// ============================================================================

interface AdaptiveFormProviderProps {
  /** Child components */
  children: ReactNode;
  /** Form configuration */
  config: AdaptiveFormConfig;
  /** Form submission handler */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  /** Initial values */
  initialValues?: Record<string, unknown>;
  /** Form context identifier */
  formContext?: string;
}

/**
 * AdaptiveFormProvider - Provides adaptive form context
 */
export const AdaptiveFormProvider: React.FC<AdaptiveFormProviderProps> = ({
  children,
  config,
  onSubmit,
  initialValues = {},
  formContext = 'default',
}) => {
  // Get cognitive load state
  const { state: cognitiveState } = useCognitiveLoad({ autoStart: true });

  // Get layout config based on load
  const layout = useMemo(
    () => getLayoutConfigForLoad(cognitiveState.level),
    [cognitiveState.level]
  );

  // Form state
  const [state, setState] = useState<FormState>({
    values: { ...initialValues },
    errors: {},
    touched: new Set(),
    dirty: new Set(),
    submitCount: 0,
    isSubmitting: false,
    isValid: true,
  });

  // Track visible fields
  const visibleFields = useMemo(() => {
    return config.fields.filter(field => 
      shouldShowField(field, cognitiveState.level, state.values)
    );
  }, [config.fields, cognitiveState.level, state.values]);

  // Field visibility map
  const fieldVisibility = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const field of config.fields) {
      map.set(
        field.id,
        shouldShowField(field, cognitiveState.level, state.values)
      );
    }
    return map;
  }, [config.fields, cognitiveState.level, state.values]);

  // Get validation mode
  const validationMode = useMemo(() => {
    if (config.validationMode === 'adaptive') {
      return getAdaptiveValidationMode(cognitiveState.level);
    }
    return config.validationMode;
  }, [config.validationMode, cognitiveState.level]);

  // Set field value
  const setFieldValue = useCallback((fieldId: string, value: unknown) => {
    setState(prev => {
      const newValues = { ...prev.values, [fieldId]: value };
      const newDirty = new Set(prev.dirty);
      newDirty.add(fieldId);

      // Validate on change if mode is onChange
      let newErrors = { ...prev.errors };
      if (validationMode === 'onChange' && prev.touched.has(fieldId)) {
        const field = config.fields.find(f => f.id === fieldId);
        if (field?.validation) {
          newErrors[fieldId] = validateFieldValue(
            value,
            field.validation,
            cognitiveState.level
          );
        }
      }

      return {
        ...prev,
        values: newValues,
        dirty: newDirty,
        errors: newErrors,
      };
    });
  }, [config.fields, validationMode, cognitiveState.level]);

  // Set field touched
  const setFieldTouched = useCallback((fieldId: string, touched = true) => {
    setState(prev => {
      const newTouched = new Set(prev.touched);
      
      if (touched) {
        newTouched.add(fieldId);
      } else {
        newTouched.delete(fieldId);
      }

      // Validate on blur if mode is onBlur or adaptive
      let newErrors = { ...prev.errors };
      if ((validationMode === 'onBlur' || validationMode === 'adaptive') && touched) {
        const field = config.fields.find(f => f.id === fieldId);
        if (field?.validation) {
          newErrors[fieldId] = validateFieldValue(
            prev.values[fieldId],
            field.validation,
            cognitiveState.level
          );
        }
      }

      return {
        ...prev,
        touched: newTouched,
        errors: newErrors,
      };
    });
  }, [config.fields, validationMode, cognitiveState.level]);

  // Validate a field
  const validateField = useCallback((fieldId: string): string[] => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field?.validation) return [];

    const errors = validateFieldValue(
      state.values[fieldId],
      field.validation,
      cognitiveState.level
    );

    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [fieldId]: errors },
    }));

    return errors;
  }, [config.fields, state.values, cognitiveState.level]);

  // Validate all fields
  const validateAll = useCallback((): boolean => {
    const allErrors: Record<string, string[]> = {};
    let isValid = true;

    for (const field of visibleFields) {
      if (field.validation) {
        const errors = validateFieldValue(
          state.values[field.id],
          field.validation,
          cognitiveState.level
        );
        if (errors.length > 0) {
          allErrors[field.id] = errors;
          isValid = false;
        }
      }
    }

    setState(prev => ({
      ...prev,
      errors: allErrors,
      isValid,
    }));

    return isValid;
  }, [visibleFields, state.values, cognitiveState.level]);

  // Reset form
  const resetForm = useCallback(() => {
    setState({
      values: { ...initialValues },
      errors: {},
      touched: new Set(),
      dirty: new Set(),
      submitCount: 0,
      isSubmitting: false,
      isValid: true,
    });
  }, [initialValues]);

  // Submit form
  const submitForm = useCallback(async () => {
    setState(prev => ({ ...prev, submitCount: prev.submitCount + 1 }));

    if (!validateAll()) {
      return;
    }

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      // Record used defaults
      for (const [fieldId, value] of Object.entries(state.values)) {
        recordDefaultUsed(fieldId, value, true);
      }

      // Record preferences if learning is enabled
      if (config.enableLearning) {
        const store = getGlobalStore();
        const context = buildContext(formContext, cognitiveState.level);
        
        for (const [fieldId, value] of Object.entries(state.values)) {
          const field = config.fields.find(f => f.id === fieldId);
          if (field?.category) {
            store.record(
              `form:${field.category}:${fieldId}`,
              field.category,
              value,
              context
            );
          }
        }
      }

      await onSubmit(state.values);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [validateAll, state.values, onSubmit, config.enableLearning, config.fields, formContext, cognitiveState.level]);

  // Get field error
  const getFieldError = useCallback((fieldId: string): string[] => {
    return state.errors[fieldId] || [];
  }, [state.errors]);

  // Check field visibility
  const isFieldVisible = useCallback((fieldId: string): boolean => {
    return fieldVisibility.get(fieldId) || false;
  }, [fieldVisibility]);

  // Check field required
  const isFieldRequired = useCallback((fieldId: string): boolean => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field?.validation) return false;
    
    // Check if required rule exists
    return field.validation.some(r => r.type === 'required');
  }, [config.fields]);

  // Get smart default for field
  const getFieldDefault = useCallback((fieldId: string): unknown => {
    const field = config.fields.find(f => f.id === fieldId);
    if (!field || !config.useSmartDefaults) {
      return field?.defaultValue;
    }

    const fieldContext: FieldContext = {
      fieldId,
      fieldType: field.type,
      pageContext: formContext,
      cognitiveLoad: cognitiveState.level,
      data: { category: field.category },
    };
    // Note: fieldContext data property is defined by type but not used in current implementation

    const smartDefault = getSmartDefault(fieldContext);
    return smartDefault?.value ?? field.defaultValue;
  }, [config.fields, config.useSmartDefaults, formContext, cognitiveState.level]);

  const contextValue: AdaptiveFormContextValue = {
    state,
    cognitiveState,
    layout,
    visibleFields,
    fieldVisibility,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateAll,
    resetForm,
    submitForm,
    getFieldError,
    isFieldVisible,
    isFieldRequired,
    getFieldDefault,
  };

  return (
    <AdaptiveFormContext.Provider value={contextValue}>
      {children}
    </AdaptiveFormContext.Provider>
  );
};

// ============================================================================
// Field Component
// ============================================================================

interface AdaptiveFieldProps {
  /** Field identifier */
  name: string;
  /** Custom className */
  className?: string;
  /** Custom label */
  label?: string;
  /** Custom description */
  description?: string;
  /** Whether to show smart default indicator */
  showSmartDefault?: boolean;
}

/**
 * AdaptiveField - Form field that adapts to cognitive load
 */
export const AdaptiveField: React.FC<AdaptiveFieldProps> = ({
  name,
  className = '',
  label,
  description,
  showSmartDefault = true,
}) => {
  const form = useAdaptiveForm();
  const field = form.visibleFields.find(f => f.id === name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if this field should be shown
  if (!field || !form.isFieldVisible(name)) {
    return null;
  }

  const value = form.state.values[name] as string | undefined;
  const errors = form.getFieldError(name);
  const isRequired = form.isFieldRequired(name);

  // Check if value is from smart default
  const isSmartDefault = useMemo(() => {
    const defaultValue = form.getFieldDefault(name);
    return value !== undefined && value === defaultValue;
  }, [form, name, value]);

  // Handle change
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    let newValue: unknown = e.target.value;
    
    if (field.type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (field.type === 'number') {
      newValue = parseFloat(newValue as string) || 0;
    }

    form.setFieldValue(name, newValue);
  };

  // Handle blur
  const handleBlur = () => {
    form.setFieldTouched(name, true);
  };

  // Get layout-based classes
  const getLayoutClasses = () => {
    const classes: string[] = [];
    
    if (!form.layout.allowInlineFields) {
      classes.push('w-full');
    }
    
    if (form.layout.fontScale !== 1) {
      classes.push(`text-[${form.layout.fontScale}rem]`);
    }

    return classes.join(' ');
  };

  const inputClasses = `
    w-full px-3 py-2 
    bg-[#0a0a0f] border rounded-lg
    text-white placeholder-white/40
    focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50
    transition-colors
    ${errors.length > 0 
      ? 'border-red-500 focus:border-red-500' 
      : 'border-white/10 focus:border-[#00d4ff]/50'
    }
    ${isSmartDefault && showSmartDefault ? 'border-[#00d4ff]/30' : ''}
    ${getLayoutClasses()}
  `;

  const renderInput = () => {
    const commonProps = {
      id: name,
      name,
      value: value || '',
      onChange: handleChange,
      onBlur: handleBlur,
      className: inputClasses,
      placeholder: field.placeholder,
      'aria-invalid': errors.length > 0,
      'aria-describedby': errors.length > 0 ? `${name}-error` : undefined,
    };

    switch (field.type) {
      case 'textarea':
        return <textarea {...commonProps} rows={4} />;
      
      case 'select':
        return (
          <select {...commonProps} value={value || ''}>
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <input
            ref={inputRef}
            type="checkbox"
            id={name}
            name={name}
            checked={!!value}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-4 h-4 rounded border-white/10 bg-[#0a0a0f] text-[#00d4ff] focus:ring-[#00d4ff]/50"
          />
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={name}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className="w-4 h-4 border-white/10 bg-[#0a0a0f] text-[#00d4ff] focus:ring-[#00d4ff]/50"
                />
                <span className="text-sm text-white/80">{opt.label}</span>
              </label>
            ))}
          </div>
        );
      
      default:
        return (
          <input
            ref={inputRef}
            type={field.type}
            {...commonProps}
          />
        );
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`space-y-2 ${className}`}
      style={{ marginBottom: `${form.layout.spacing.fieldSpacing}rem` }}
    >
      {(label || field.label) && field.type !== 'checkbox' && (
        <label 
          htmlFor={name}
          className="block text-sm font-medium text-white/80"
        >
          {label || field.label}
          {isRequired && <span className="text-red-400 ml-1">*</span>}
          {isSmartDefault && showSmartDefault && (
            <span className="ml-2 text-xs text-[#00d4ff]">✨ Smart</span>
          )}
        </label>
      )}

      {(description || field.description) && form.layout.showFieldDescriptions && (
        <p className="text-xs text-white/50">
          {description || field.description}
        </p>
      )}

      {field.type === 'checkbox' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          {renderInput()}
          <span className="text-sm text-white/80">
            {label || field.label}
            {isRequired && <span className="text-red-400 ml-1">*</span>}
          </span>
        </label>
      ) : (
        renderInput()
      )}

      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            id={`${name}-error`}
            className="space-y-1"
          >
            {errors.map((error, i) => (
              <p key={i} className="text-xs text-red-400">
                {error}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Section Component
// ============================================================================

interface AdaptiveSectionProps {
  /** Section identifier */
  id: string;
  /** Section title */
  title: string;
  /** Section content */
  children: ReactNode;
  /** When to show this section */
  showAt?: 'always' | 'low' | 'medium' | 'high';
  /** Whether section is collapsible */
  collapsible?: boolean;
}

/**
 * AdaptiveSection - Form section with progressive disclosure
 */
export const AdaptiveSection: React.FC<AdaptiveSectionProps> = ({
  id: _id,
  title,
  children,
  showAt = 'always',
  collapsible = true,
}) => {
  const form = useAdaptiveForm();
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if section should be shown
  const loadLevels: CognitiveLoadLevel[] = ['low', 'medium', 'high', 'critical'];
  const sectionIndex = loadLevels.indexOf(showAt === 'always' ? 'low' : showAt);
  const currentIndex = loadLevels.indexOf(form.cognitiveState.level);

  if (currentIndex > sectionIndex) {
    return null;
  }

  // Auto-collapse based on load
  const shouldCollapse = collapsible && 
    (form.cognitiveState.level === 'high' || form.cognitiveState.level === 'critical');

  const isVisible = !shouldCollapse || isExpanded;

  return (
    <motion.div
      layout
      className="space-y-4"
      style={{ 
        padding: `${form.layout.spacing.sectionPadding}rem`,
        marginBottom: `${form.layout.spacing.componentGap}rem`,
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">{title}</h3>
        
        {collapsible && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-[#00d4ff] hover:underline"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Submit Button Component
// ============================================================================

interface AdaptiveSubmitProps {
  /** Button children */
  children: ReactNode;
  /** Custom className */
  className?: string;
  /** Whether button is disabled */
  disabled?: boolean;
}

/**
 * AdaptiveSubmit - Submit button with adaptive styling
 */
export const AdaptiveSubmit: React.FC<AdaptiveSubmitProps> = ({
  children,
  className = '',
  disabled = false,
}) => {
  const form = useAdaptiveForm();

  return (
    <button
      type="submit"
      disabled={disabled || form.state.isSubmitting}
      onClick={(e) => {
        e.preventDefault();
        form.submitForm();
      }}
      className={`
        px-6 py-3 rounded-lg
        font-medium text-white
        bg-gradient-to-r from-[#00d4ff] to-[#00a8cc]
        hover:from-[#00e5ff] hover:to-[#00b8dd]
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-[#00d4ff]/50
        ${className}
      `}
    >
      {form.state.isSubmitting ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

// ============================================================================
// Main Form Component
// ============================================================================

interface AdaptiveFormProps {
  /** Form configuration */
  config: AdaptiveFormConfig;
  /** Form submission handler */
  onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
  /** Initial values */
  initialValues?: Record<string, unknown>;
  /** Form context identifier */
  formContext?: string;
  /** Custom className */
  className?: string;
  /** Children (form content) */
  children?: ReactNode;
}

/**
 * AdaptiveForm - Main adaptive form component
 * 
 * @example
 * ```tsx
 * <AdaptiveForm
 *   config={formConfig}
 *   onSubmit={handleSubmit}
 *   formContext="user-profile"
 * >
 *   <AdaptiveSection id="basic" title="Basic Info">
 *     <AdaptiveField name="name" />
 *     <AdaptiveField name="email" />
 *   </AdaptiveSection>
 *   <AdaptiveSubmit>Save</AdaptiveSubmit>
 * </AdaptiveForm>
 * ```
 */
export const AdaptiveForm: React.FC<AdaptiveFormProps> = ({
  config,
  onSubmit,
  initialValues,
  formContext,
  className = '',
  children,
}) => {
  return (
    <AdaptiveFormProvider
      config={config}
      onSubmit={onSubmit}
      initialValues={initialValues}
      formContext={formContext}
    >
      <form 
        className={`space-y-6 ${className}`}
        onSubmit={(e) => e.preventDefault()}
      >
        {children}
      </form>
    </AdaptiveFormProvider>
  );
};

// ============================================================================
// Export
// ============================================================================

export default {
  Form: AdaptiveForm,
  Provider: AdaptiveFormProvider,
  Field: AdaptiveField,
  Section: AdaptiveSection,
  Submit: AdaptiveSubmit,
  useAdaptiveForm,
};
