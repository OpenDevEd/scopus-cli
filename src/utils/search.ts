import fs from 'fs';
import {
  Facet, Field, Sorting, Subj,
} from '../types/scopusSearchRequest';
import { Link, ScopusSearchResponse } from '../types/scopusSearchResponse';
import GET from './get';

export function urlEncodeQuery(query: string) {
  const encode = encodeURIComponent(query).replace(/%20/g, '+').replace(/\(/g, '%28').replace(/\)/g, '%29');
  return encode;
}

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

export function validateParameters(
  retrieveAllPages?: boolean,
  startPage?: number,
  endPage?: number,
  chunkSize?: number,
  toJson?: string,
  perPage?: number,
) {
  if (retrieveAllPages && (startPage || endPage)) {
    throw new Error('startPage and endPage are not allowed with retrieveAllPages');
  }

  if (chunkSize && (startPage || endPage)) throw new Error('startPage and endPage are not allowed with chunkSize');
  if (chunkSize && !toJson) throw new Error('toJson is required with chunkSize');

  // TODO: Remove this validation when the Scopus API is fixed
  if (perPage && perPage > 25) throw new Error('perPage must be less than or equal to 25');
}

export function parseCountAndStart(
  count: number,
  start: number,
  retriveAllPages: boolean,
) {
  let searchCount = count;
  let searchStart = start;
  if (retriveAllPages) {
    searchCount = 25;
    searchStart = 0;
  }
  return { searchCount, searchStart };
}

function getNext(links: Link[]) {
  return links.find((l) => l['@ref'] === 'next');
}

export async function handleMultiplePages(
  data: ScopusSearchResponse,
  headers: Record<string, string>,
  start: number,
  end: number,
): Promise<ScopusSearchResponse> {
  const links = data['search-results'].link;
  let next = getNext(links);
  const allData = data;
  let page = start + 1;
  while (next && page < end) {
    console.log(`Retrieving page ${page}`);
    page += 1;
    const nextData = await GET(next['@href'], headers, {});
    allData['search-results'].entry.push(...nextData.data['search-results'].entry);
    next = getNext(nextData.data['search-results'].link);
  }
  return allData;
}

export async function handleAllPages(
  data: ScopusSearchResponse,
  headers: Record<string, string>,
): Promise<ScopusSearchResponse> {
  const links = data['search-results'].link;
  let next = getNext(links);
  const allData = data;
  let page = 1;
  while (next) {
    console.log(`Retrieving page ${page}`);
    page += 1;
    const nextData = await GET(next['@href'], headers, {});
    allData['search-results'].entry.push(...nextData.data['search-results'].entry);
    next = getNext(nextData.data['search-results'].link);
  }

  return allData;
}

export function formatNumber(num: number): string {
  // Pad the number to 7 digits
  const paddedNum = num.toString().padStart(7, '0');

  // Format the padded number with commas as thousands separators
  const parts = paddedNum.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return parts.join('.');
}

export async function handleAllPagesInChunks(
  data: ScopusSearchResponse,
  headers: Record<string, string>,
  chunkSize: number,
  toJson: string,
): Promise<ScopusSearchResponse> {
  const links = data['search-results'].link;
  let next = getNext(links);
  const chunk = data;
  let page = 1;
  let start = 0;
  let end;
  while (next) {
    console.log(`Retrieving page ${page}`);
    page += 1;
    const nextData = await GET(next['@href'], headers, {});
    chunk['search-results'].entry.push(...nextData.data['search-results'].entry);
    next = getNext(nextData.data['search-results'].link);
    if (chunk['search-results'].entry.length >= chunkSize || !next) {
      end = start + chunk['search-results'].entry.length;
      const startFormatted = formatNumber(start + 1);
      const endFormatted = formatNumber(end);
      fs.writeFileSync(
        `${toJson}-${startFormatted}-${endFormatted}.json`,
        JSON.stringify(chunk, null, 2),
      );
      start = end;
      chunk['search-results'].entry = [];
    }
  }

  return data;
}
