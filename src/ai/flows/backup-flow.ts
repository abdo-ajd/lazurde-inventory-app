'use server';
/**
 * @fileOverview A service for creating and retrieving temporary data backups.
 *
 * - createBackup - A flow that accepts a JSON string, stores it, and returns a unique ID.
 * - getBackup - A flow that retrieves a stored JSON string using its unique ID.
 */
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import crypto from 'crypto';

// Simple in-memory store. Data will be lost on server restart.
const backupStore = new Map<string, string>();

// Define schema for input/output for clarity, even if it's just a string.
const BackupDataSchema = z.string().describe('A JSON string representing the entire application backup data.');
const BackupIdSchema = z.string().describe('A unique ID for retrieving a backup.');

// Define the flow for creating a backup
const createBackupFlow = ai.defineFlow(
  {
    name: 'createBackupFlow',
    inputSchema: BackupDataSchema,
    outputSchema: BackupIdSchema,
  },
  async (jsonData) => {
    // Generate a more user-friendly ID
    const id = `${crypto.randomUUID().slice(0, 4)}-${crypto.randomUUID().slice(0, 4)}`;
    backupStore.set(id, jsonData);
    
    // Set a timeout to clear the backup after 24 hours to save memory
    setTimeout(() => {
        backupStore.delete(id);
        console.log(`Backup with ID ${id} has expired and been deleted.`);
    }, 24 * 60 * 60 * 1000); // 24 hours

    return id;
  }
);

// Define the flow for retrieving a backup
const getBackupFlow = ai.defineFlow(
  {
    name: 'getBackupFlow',
    inputSchema: BackupIdSchema,
    outputSchema: BackupDataSchema.nullable(),
  },
  async (backupId) => {
    return backupStore.get(backupId) ?? null;
  }
);


// Exported wrapper functions for client-side usage
export async function createBackup(jsonData: string): Promise<string> {
    return createBackupFlow(jsonData);
}

export async function getBackup(backupId: string): Promise<string | null> {
    return getBackupFlow(backupId);
}
