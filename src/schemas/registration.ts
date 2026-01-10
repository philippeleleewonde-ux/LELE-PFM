import { z } from 'zod';
import type { UserRole } from '@/types/roles';
import type { RegistrationData } from '@/types/registration';

// Schémas de validation par étape - Performance optimisée
export const identitySchema = z.object({
  email: z.string()
    .email('Email invalide')
    .min(1, 'Email requis'),
  password: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
  confirmPassword: z.string(),
  firstName: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
  lastName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const professionalSchemaByRole = {
  CEO: z.object({
    companyName: z.string().min(1, 'Nom de l\'entreprise requis'),
    industry: z.string().min(1, 'Secteur d\'activité requis'),
    employeesCount: z.string().optional(),
    position: z.string().optional(),
  }),
  
  CONSULTANT: z.object({
    consultingFirm: z.string().min(1, 'Société de conseil requise'),
    companyName: z.string().optional(),
    industry: z.string().optional(),
  }),
  
  BANQUIER: z.object({
    companyName: z.string().min(1, 'Nom de la banque requis'), // bank_name
    department: z.string().min(1, 'Service requis'),
    position: z.string().optional(),
    consultingFirm: z.string().optional(), // license_number
  }),
  
  RH_MANAGER: z.object({
    department: z.string().optional(),
    yearsExperience: z.string().optional(),
  }),
  
  EMPLOYEE: z.object({
    department: z.string().optional(),
    position: z.string().optional(),
    employeeId: z.string().optional(),
  }),
  
  TEAM_LEADER: z.object({
    teamName: z.string().optional(),
    department: z.string().optional(),
    teamSize: z.string().optional(),
  }),
};

export const invitationSchema = z.object({
  invitationCode: z.string()
    .min(1, 'Code d\'invitation requis')
    .regex(/^HCM-[A-Z0-9]{5}-[A-Z0-9]{5}$/, 'Format de code invalide (HCM-XXXXX-XXXXX)'),
});

// Schéma complet dynamique selon le rôle
export const createRegistrationSchema = (role: UserRole) => {
  // Schema de base sans refine pour pouvoir extend
  const baseSchema = z.object({
    email: z.string().email('Email invalide').min(1, 'Email requis'),
    password: z.string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    confirmPassword: z.string(),
    firstName: z.string()
      .min(2, 'Le prénom doit contenir au moins 2 caractères')
      .max(50, 'Le prénom ne peut pas dépasser 50 caractères'),
    lastName: z.string()
      .min(2, 'Le nom doit contenir au moins 2 caractères')
      .max(50, 'Le nom ne peut pas dépasser 50 caractères'),
    phone: z.string().optional(),
    role: z.literal(role),
  });

  const professionalSchema = professionalSchemaByRole[role];
  const needsInvitation = ['RH_MANAGER', 'EMPLOYEE', 'TEAM_LEADER'].includes(role);

  let schema = baseSchema.merge(professionalSchema);
  
  if (needsInvitation) {
    schema = schema.merge(invitationSchema);
  }

  // Ajouter la validation des mots de passe à la fin
  return schema.refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });
};

// Validation par étape pour performance
export const validateStep = (stepId: string, data: Partial<RegistrationData>, role: UserRole) => {
  switch (stepId) {
    case 'identity':
      return identitySchema.safeParse(data);
    case 'professional':
      return professionalSchemaByRole[role].safeParse(data);
    case 'invitation':
      return invitationSchema.safeParse(data);
    default:
      return { success: true };
  }
};
