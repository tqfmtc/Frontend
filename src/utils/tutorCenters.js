// Helpers for tutor.assignments: [{ center, sessionType, sessionTiming }],
// where center is an id or a populated { _id, name, ... }

export const SESSION_TYPES = [
  { value: 'arabic', label: 'Arabic' },
  { value: 'tuition', label: 'Tuition' },
];

export const SESSION_TIMINGS = [
  { value: 'after_fajr', label: 'Post Fajr' },
  { value: 'after_zohar', label: 'Post Zohar' },
  { value: 'after_asar', label: 'Post Asar' },
  { value: 'after_maghrib', label: 'Post Maghrib' },
  { value: 'after_isha', label: 'Post Isha' },
];

export const idOf = (ref) => String(ref?._id ?? ref ?? '');

const labelOf = (list, value) => list.find((o) => o.value === value)?.label || value || '';
export const sessionTypeLabel = (value) => labelOf(SESSION_TYPES, value);
export const sessionTimingLabel = (value) => labelOf(SESSION_TIMINGS, value);

// Populated center objects of a tutor
export const tutorCenters = (tutor) =>
  (tutor?.assignments || []).map((a) => a.center).filter((c) => c && typeof c === 'object');

export const tutorCenterIds = (tutor) =>
  (tutor?.assignments || []).map((a) => idOf(a.center)).filter(Boolean);

export const tutorCenterNames = (tutor, fallback = 'Not assigned') =>
  tutorCenters(tutor).map((c) => c.name).filter(Boolean).join(', ') || fallback;

// Assignments with center ids only, as the API expects them
export const assignmentsForApi = (list) =>
  (list || []).map((a) => ({ center: idOf(a.center), sessionType: a.sessionType, sessionTiming: a.sessionTiming }));

// Stable comparison key for a list of assignments
export const assignmentsKey = (list) =>
  assignmentsForApi(list).map((a) => `${a.center}|${a.sessionType}|${a.sessionTiming}`).join(',');

export const emptyAssignment = () => ({ center: '', sessionType: '', sessionTiming: '' });

// Error message for an assignments list, or '' when valid
export const validateAssignments = (list) => {
  if (!list?.length) return 'At least one center is required.';
  const ids = list.map((a) => idOf(a.center));
  if (list.some((a) => !idOf(a.center))) return 'Select a center for every row.';
  if (list.some((a) => !a.sessionType || !a.sessionTiming)) return 'Select the session type and timing for every center.';
  if (new Set(ids).size !== ids.length) return 'Each center can be added only once.';
  return '';
};
