import {
  Facet, Field, Sorting, Subj,
} from '../types/scopusSearchRequest';

export function parseField(field: Field | Field[]) {
  let fieldString = '';
  if (field) {
    if (Array.isArray(field)) {
      fieldString = field.map((f) => {
        if (f.includes('.')) {
          return f.split('.').join(',');
        }
        return f;
      }).join(',');
    } else if (field.includes('.')) {
      fieldString = field.split('.').join(',');
    } else {
      fieldString = field;
    }
  }
  return fieldString;
}

export function parseSort(sort: Sorting | Sorting[]) {
  let sortString = '';
  if (sort) {
    if (Array.isArray(sort)) {
      const first3 = sort.slice(0, 3);
      sortString = first3.map((s) => {
        if (!s.order) {
          return `${s.field}`;
        }
        if (s.order === 'asc') {
          return `+${s.field}`;
        }
        return `-${s.field}`;
      }).join(',');
    } else if (!sort.order) {
      sortString = `${sort.field}`;
    } else if (sort.order === 'asc') {
      sortString = `+${sort.field}`;
    } else if (sort.order === 'desc') {
      sortString = `-${sort.field}`;
    }
  }
  return sortString;
}

export function parseSubj(subj: Subj | Subj[]) {
  let subjString = '';
  if (subj) {
    if (Array.isArray(subj)) {
      subjString = subj.join(',');
    } else {
      subjString = subj;
    }
  }
  return subjString;
}

export function parseFacets(facets: Facet | Facet[]) {
  let facetsString = '';
  if (facets) {
    if (Array.isArray(facets)) {
      facetsString = facets.map((facet) => {
        const {
          option, count: countFacet, sort: sortFacet, prefix,
        } = facet;
        return `{"option":"${option}"${countFacet ? `,"count":${countFacet}` : ''}${sortFacet ? `,"sort":"${sortFacet}"` : ''}${prefix ? `,"prefix":"${prefix}"` : ''}}`;
      }).join(';');
    } else {
      facetsString = `{"option":"${facets.option}"${facets.count ? `,"count":${facets.count}` : ''}${facets.sort ? `,"sort":"${facets.sort}"` : ''}${facets.prefix ? `,"prefix":"${facets.prefix}"` : ''}}`;
    }
  }
  return facetsString;
}
