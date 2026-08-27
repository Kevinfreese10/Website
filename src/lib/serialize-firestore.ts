/**
 * Deeply serializes Firestore data (converting Firestore Timestamps, Dates, and nested
 * non-plain objects to plain JSON-compatible types) so they can be safely passed from
 * Next.js Server Components to Client Components without serialization errors.
 */
export function serializeFirestoreData<T>(data: any): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Firestore Timestamp with toDate() method
  if (typeof data?.toDate === 'function') {
    try {
      return data.toDate().toISOString() as any;
    } catch {
      return null as any;
    }
  }

  // JS Date
  if (data instanceof Date) {
    return data.toISOString() as any;
  }

  // Timestamp raw object { seconds: number, nanoseconds: number }
  if (
    typeof data === 'object' &&
    typeof data.seconds === 'number' &&
    typeof data.nanoseconds === 'number'
  ) {
    return new Date(data.seconds * 1000).toISOString() as any;
  }

  // Arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeFirestoreData(item)) as any;
  }

  // Plain objects & dictionaries
  if (typeof data === 'object') {
    const serialized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeFirestoreData(value);
    }
    return serialized as T;
  }

  return data;
}

/**
 * Ensures an object is 100% a plain JSON object with no custom class prototypes or methods.
 */
export function toPlainObject<T>(data: T): T {
  const sanitized = serializeFirestoreData(data);
  return JSON.parse(JSON.stringify(sanitized));
}
