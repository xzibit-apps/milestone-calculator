// lib/validation.ts - Zod schema for form validation
import { z } from 'zod';
import { MESSAGES } from './constants';

export const projectInputSchema = z.object({
  projectName: z.string().min(1, MESSAGES.PROJECT_NAME_REQUIRED),
  clientName: z.string().min(1, MESSAGES.CLIENT_NAME_REQUIRED),
  truckLeaveDate: z.string().nullable().optional(),
  buildType: z.enum(['hire', 'hybrid', 'custom', 'engineered']),
  standSize: z.enum(['small', 'medium', 'large']),
  avComplexity: z.enum(['basic', 'medium', 'high']),
  fabricationIntensity: z.enum(['standard', 'some_custom', 'heavy_custom']),
  briefClarity: z.enum(['clear', 'some_unknowns', 'vague']),
  engineeringRequired: z.boolean(),
  longLeadItems: z.boolean(),
  infoGates: z.object({
    finalDrawings: z.boolean(),
    finishesConfirmed: z.boolean(),
    brandingAssets: z.boolean(),
    avInputsConfirmed: z.boolean(),
    engineeringSignedOff: z.boolean(),
    clientScopeApproved: z.boolean(),
  }),
}).refine((data) => {
  // If truck leave date is provided, validate it
  if (data.truckLeaveDate) {
    const date = new Date(data.truckLeaveDate);
    if (isNaN(date.getTime())) {
      return false;
    }
    // Ensure date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const inputDate = new Date(date);
    inputDate.setHours(0, 0, 0, 0);
    if (inputDate < today) {
      return false;
    }
  }
  return true;
}, {
  message: MESSAGES.TRUCK_LEAVE_DATE_FUTURE,
  path: ['truckLeaveDate'],
});

export type ProjectInputFormData = z.infer<typeof projectInputSchema>;

