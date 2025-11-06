import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

const createValidationMiddleware = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const caseSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(2000).optional(),
  caseType: Joi.string().valid(
    'CRIMINAL_DEFENSE',
    'CRIMINAL_PROSECUTION', 
    'CIVIL_LITIGATION',
    'FAMILY_LAW',
    'CORPORATE_LAW',
    'OTHER'
  ).required()
});

const servicesSchema = Joi.object({
  caseId: Joi.string().required(),
  title: Joi.string().optional(),
  mcpModules: Joi.object({
    legalDoctrine: Joi.any().optional(),
    legalProcedure: Joi.any().optional(),
    legalPrinciples: Joi.any().optional(),
    admissibleEvidence: Joi.any().optional(),
    casePrecedents: Joi.any().optional(),
    clientPsychology: Joi.any().optional()
  }).optional()
});

export const validateAuth = {
  register: createValidationMiddleware(registerSchema),
  login: createValidationMiddleware(loginSchema)
};

export const validateCase = {
  create: createValidationMiddleware(caseSchema),
  update: createValidationMiddleware(caseSchema.fork(['title', 'caseType'], (schema) => schema.optional()))
};

export const validateServices = {
  create: createValidationMiddleware(servicesSchema)
};