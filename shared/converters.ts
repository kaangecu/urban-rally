import type { Member, Task, TaskSubmission, Team } from './schema';

// Pure converters with no Firebase import, so the web SDK and the Admin SDK
// can both use them. Every Timestamp becomes a Date here and nowhere else.

type DocData = Record<string, unknown>;

export interface Converter<T extends { id: string }> {
  toFirestore(model: T): DocData;
  fromFirestore(id: string, data: DocData): T;
}

function isTimestamp(value: unknown): value is { toDate(): Date } {
  return typeof value === 'object' && value !== null && typeof (value as { toDate?: unknown }).toDate === 'function';
}

function isPlainObject(value: unknown): value is DocData {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

function readValue(value: unknown): unknown {
  if (isTimestamp(value)) return value.toDate();
  if (Array.isArray(value)) return value.map(readValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, readValue(inner)]));
  }
  return value;
}

// Firestore rejects undefined, so optional fields that are unset are left out.
function writeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(writeValue);
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, inner]) => inner !== undefined)
        .map(([key, inner]) => [key, writeValue(inner)]),
    );
  }
  return value;
}

function createConverter<T extends { id: string }>(defaults: () => Partial<T> = () => ({})): Converter<T> {
  return {
    toFirestore(model) {
      const { id: _id, ...data } = model;
      return writeValue(data) as DocData;
    },
    fromFirestore(id, data) {
      return { ...defaults(), ...(readValue(data) as DocData), id } as T;
    },
  };
}

export const teamConverter = createConverter<Team>(() => ({ score: 0, completedTaskIds: [], memberCount: 0 }));
export const taskConverter = createConverter<Task>();
export const submissionConverter = createConverter<TaskSubmission>();
export const memberConverter = createConverter<Member>();
