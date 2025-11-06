import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CreateCaseRequest } from '../types';

const prisma = new PrismaClient();

export const getCases = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const cases = await prisma.case.findMany({
      where: { userId: req.user.id },
      include: {
        services: true,
        evidence: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(cases);
  } catch (error) {
    console.error('Get cases error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCase = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const case_ = await prisma.case.findFirst({
      where: { 
        id,
        userId: req.user.id 
      },
      include: {
        services: true,
        evidence: true
      }
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json(case_);
  } catch (error) {
    console.error('Get case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createCase = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { title, description, caseType }: CreateCaseRequest = req.body;

    const case_ = await prisma.case.create({
      data: {
        title,
        description,
        caseType,
        userId: req.user.id
      },
      include: {
        services: true,
        evidence: true
      }
    });

    res.status(201).json(case_);
  } catch (error) {
    console.error('Create case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCase = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const updates = req.body;

    const case_ = await prisma.case.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }

    const updatedCase = await prisma.case.update({
      where: { id },
      data: updates,
      include: {
        services: true,
        evidence: true
      }
    });

    res.json(updatedCase);
  } catch (error) {
    console.error('Update case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteCase = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const case_ = await prisma.case.findFirst({
      where: { 
        id,
        userId: req.user.id 
      }
    });

    if (!case_) {
      return res.status(404).json({ error: 'Case not found' });
    }

    await prisma.case.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};