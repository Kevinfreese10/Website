import type { PortalDriver } from '../types.js';
import { efilingDriver } from './efiling.js';
import { cipcDriver } from './cipc.js';

export const DRIVERS: Record<string, PortalDriver> = {
  efiling: efilingDriver,
  cipc: cipcDriver,
};
