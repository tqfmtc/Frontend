import React, { useState } from 'react';
import { SESSION_TYPES, SESSION_TIMINGS, idOf, emptyAssignment } from '../../../utils/tutorCenters';

// One row per center the tutor teaches at, each with its own session type and timing.
// value: [{ center, sessionType, sessionTiming }] (center may be an id or a populated object)
const CenterAssignmentsEditor = ({ value, onChange, centers, error }) => {
  const rows = value?.length ? value : [emptyAssignment()];
  const [queries, setQueries] = useState({});
  const [openRow, setOpenRow] = useState(null);

  const centerName = (ref) => {
    const id = idOf(ref);
    const c = centers.find((x) => x._id === id) || (typeof ref === 'object' ? ref : null);
    return c ? `${c.name}${c.area ? `, ${c.area}` : ''}` : '';
  };

  const update = (index, patch) => onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  const remove = (index) => {
    setQueries({});
    onChange(rows.filter((_, i) => i !== index));
  };

  const selectClass = 'w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500 transition';

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const takenIds = rows.filter((_, i) => i !== index).map((r) => idOf(r.center));
        const query = queries[index] ?? centerName(row.center);
        const matches = centers.filter((c) => {
          if (takenIds.includes(c._id)) return false;
          const q = (queries[index] ?? '').toLowerCase();
          return c.name.toLowerCase().includes(q) || (c.area && c.area.toLowerCase().includes(q));
        });
        return (
          <div key={index} className="bg-white p-3 rounded border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Center {rows.length > 1 ? index + 1 : ''} <span className="text-red-600">*</span>
              </span>
              {rows.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="text-xs text-red-600 hover:underline">
                  Remove
                </button>
              )}
            </div>

            <div className="relative mb-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQueries((q) => ({ ...q, [index]: e.target.value }))}
                onFocus={() => setOpenRow(index)}
                onBlur={() => setTimeout(() => {
                  setOpenRow(null);
                  setQueries((q) => { const next = { ...q }; delete next[index]; return next; });
                }, 200)}
                placeholder="Search for a center"
                className={selectClass}
              />
              {openRow === index && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-60 overflow-auto">
                  {matches.map((center) => (
                    <div
                      key={center._id}
                      className="px-3 py-1.5 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => {
                        update(index, { center: center._id });
                        setOpenRow(null);
                      }}
                    >
                      {center.name}{center.area ? `, ${center.area}` : ''}
                    </div>
                  ))}
                  {matches.length === 0 && <div className="px-3 py-1.5 text-sm text-gray-500">No centers found</div>}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={row.sessionType || ''}
                onChange={(e) => update(index, { sessionType: e.target.value })}
                className={selectClass}
              >
                <option value="">Session Type</option>
                {SESSION_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <select
                value={row.sessionTiming || ''}
                onChange={(e) => update(index, { sessionTiming: e.target.value })}
                className={selectClass}
              >
                <option value="">Session Timing</option>
                {SESSION_TIMINGS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...rows, emptyAssignment()])}
        className="px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-300 rounded hover:bg-blue-50"
      >
        + Add another center
      </button>

      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
};

export default CenterAssignmentsEditor;
