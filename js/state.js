// Shared filter state. Every view reads from here; only setFilters/resetFilters change it.
// See PROJECT.md "Shared APIs" before editing (owner: A).

const DEFAULTS = {
  yearRange: [2016, 2025],
  primaryTypes: ['THEFT', 'MOTOR VEHICLE THEFT'],
  typeGroups: null, // array of type_group strings, or null for all
  locGroups: null,
  sides: null,
};

export const filters = structuredClone(DEFAULTS);

const listeners = [];

// Shallow-merge a patch into filters, then notify listeners.
export function setFilters(patch) {
  Object.assign(filters, patch);
  notify();
}

export function resetFilters() {
  Object.assign(filters, structuredClone(DEFAULTS));
  notify();
}

export function onChange(fn) {
  listeners.push(fn);
}

function notify() {
  listeners.forEach(fn => fn(filters));
}

// Rows matching the current filters. `ignore` lists filter keys to skip, so a view
// can avoid filtering on its own dimension (e.g. View 2 passes ['typeGroups']).
// Rows need a `primary` field; main.js adds it on load from lookups.type_primary.
export function applyFilters(rows, { ignore = [] } = {}) {
  const use = key => !ignore.includes(key);
  const allowed = (list, value) => list == null || list.includes(value);
  const [y0, y1] = filters.yearRange;

  return rows.filter(d =>
    (!use('yearRange') || (d.year >= y0 && d.year <= y1)) &&
    (!use('primaryTypes') || filters.primaryTypes.includes(d.primary)) &&
    (!use('typeGroups') || allowed(filters.typeGroups, d.type_group)) &&
    (!use('locGroups') || allowed(filters.locGroups, d.loc_group)) &&
    (!use('sides') || allowed(filters.sides, d.side))
  );
}
