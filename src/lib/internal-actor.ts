/**
 * @fileOverview Unforgeable internal actor token.
 * Used exclusively by system crons, webhook handlers, and background pipelines to execute
 * administrative order transitions without a user token.
 *
 * This is compared by REFERENCE identity, not by value. Remote callers cannot transmit
 * a reference to this exact symbol.
 */
export const INTERNAL_SYSTEM_ACTOR = Symbol('internalSystemActor');
export type InternalActor = typeof INTERNAL_SYSTEM_ACTOR;
