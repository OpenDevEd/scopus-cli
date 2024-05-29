import fs from 'fs';
import { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import {
  Facet, Field, InfoObject, Meta, Sorting, Subj,
} from '../types/scopusSearchRequest';
import { Link, ReturnWithMeta, ScopusSearchResponse } from '../types/scopusSearchResponse';
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
  chunkSize?: number,
  toJson?: string,
  resultsNumber?: number,
  keyType?: 'Developer' | 'Institutional',
) {
  if (chunkSize && !toJson) throw new Error('toJson is required with chunkSize');

  // TODO: Remove this validation when the Scopus API is fixed
  if (resultsNumber && keyType === 'Developer' && resultsNumber > 5000) throw new Error('resultsNumber must be less than or equal to 5000 for Developer keys');

  if (retrieveAllPages && chunkSize) {
    if (keyType === 'Developer') {
      if (chunkSize < 25) console.warn('chunkSize must be greater than or equal to 25');
    }
    if (keyType === 'Institutional') {
      if (chunkSize < 200) console.warn('chunkSize must be greater than or equal to 200');
    }
  }
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

export function metadata(data: ScopusSearchResponse, meta: Meta, sourceFormat: 'original' | 'chunk'): ReturnWithMeta {
  const output = {
    meta: {
      version: 'OpenDevEd_jsonUploaderV01',
      query: meta.query,
      queryUrl: meta.queryUrl,
      searchId: uuidv4(),
      searchTerm: meta.searchTerm,
      totalResults: data['search-results']['opensearch:totalResults'],
      source: 'Scopus',
      sourceFormat,
      date: new Date().toISOString().replace('T', ' ').replace(/\..+/, ''),
      // eslint-disable-next-line no-nested-ternary
      searchField: meta.searchScope,
      page: 1,
      resultsPerPage: data['search-results']['opensearch:itemsPerPage'],
      firstItem: data['search-results']['opensearch:startIndex'],
      startingPage: '',
      endingPage: '',
      filters: meta.filters,
      groupBy: '',
      sortBy: {
        field: meta.sortBy.field,
        order: meta.sortBy.order,
      },
    },
    results: data['search-results'].entry,
  };
  return output;
}

export async function handleMultipleResutls(
  data: ScopusSearchResponse,
  headers: Record<string, string>,
  resultsNumber: number,
  perPage: number,
  meta: Meta,
  infoFile: string,
  infoObject: InfoObject,
): Promise<ReturnWithMeta> {
  const links = data['search-results'].link;
  let next = getNext(links);
  const allData = data;
  let totalResults = perPage;
  while (resultsNumber > 0 && next) {
    let infoString = `Retrieving results from ${totalResults} to ${totalResults + perPage}`;
    const nextData = await GET(next['@href'], headers, {});
    infoObject.endTime = new Date().getTime();
    infoObject.timeTaken = (infoObject.endTime - infoObject.startTime) / 1000;
    infoObject.completionFraction = infoObject.currentApiRequestCallNumber
      / infoObject.totalNumberOfApiCallsNeeded;
    infoObject.estimatedTime = infoObject.timeTaken / infoObject.completionFraction;
    infoObject.remainingTime = infoObject.estimatedTime - infoObject.timeTaken;
    infoObject.remainingTimeFormated = new Date(infoObject.remainingTime * 1000)
      .toISOString().slice(11, 19);
    infoObject.currentApiRequestCallNumber += 1;
    infoString += `\n- Progress: ${Math.round((infoObject.currentApiRequestCallNumber / infoObject.totalNumberOfApiCallsNeeded) * 100)}%`;
    infoString += `\n- Remaining time: ${infoObject.remainingTimeFormated}`;
    const remainingQueries = nextData.headers['x-ratelimit-remaining'];
    infoString += `\n- Remaining Quota: ${remainingQueries}`;
    allData['search-results'].entry.push(...nextData.data['search-results'].entry);
    totalResults += perPage;
    resultsNumber -= perPage;
    next = getNext(nextData.data['search-results'].link);
    console.log(infoString);
    fs.appendFileSync(`${infoFile}.info.txt`, `${infoString}\n`);
  }
  allData['search-results']['opensearch:itemsPerPage'] = totalResults.toString();
  const allDataWithMeta = metadata(allData, meta, 'original');
  return allDataWithMeta;
}

export async function handleAllPages(
  data: ScopusSearchResponse,
  headers: Record<string, string>,
  meta: Meta,
  infoFile: string,
  infoObject: InfoObject,
): Promise<ReturnWithMeta> {
  const links = data['search-results'].link;
  let next = getNext(links);
  const allData = data;
  let page = 1;
  while (next) {
    let infoString = `Retrieving page ${page}`;
    page += 1;
    const nextData = await GET(next['@href'], headers, {});
    infoObject.endTime = new Date().getTime();
    infoObject.timeTaken = (infoObject.endTime - infoObject.startTime) / 1000;
    infoObject.completionFraction = infoObject.currentApiRequestCallNumber
      / infoObject.totalNumberOfApiCallsNeeded;
    infoObject.estimatedTime = infoObject.timeTaken / infoObject.completionFraction;
    infoObject.remainingTime = infoObject.estimatedTime - infoObject.timeTaken;
    infoObject.remainingTimeFormated = new Date(infoObject.remainingTime * 1000)
      .toISOString().slice(11, 19);
    infoObject.currentApiRequestCallNumber += 1;
    infoString += `\n- Progress: ${Math.round((infoObject.currentApiRequestCallNumber / infoObject.totalNumberOfApiCallsNeeded) * 100)}%`;
    infoString += `\n- Remaining time: ${infoObject.remainingTimeFormated}`;
    const remainingQueries = nextData.headers['x-ratelimit-remaining'];
    infoString += `\n- Remaining queries: ${remainingQueries}`;
    allData['search-results'].entry.push(...nextData.data['search-results'].entry);
    next = getNext(nextData.data['search-results'].link);
    console.log(infoString);
    fs.appendFileSync(`${infoFile}.info.txt`, `${infoString}\n`);
  }
  allData['search-results']['opensearch:itemsPerPage'] = allData['search-results']['opensearch:totalResults'];
  const allDataWithMeta = metadata(allData, meta, 'original');
  return allDataWithMeta;
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
  meta: Meta,
  infoObject: InfoObject,
): Promise<ReturnWithMeta> {
  const links = data['search-results'].link;
  let next = getNext(links);
  const chunk = data;
  let page = 1;
  let start = 0;
  let end: number;
  if (chunk['search-results'].entry.length >= chunkSize || !next) {
    end = start + chunk['search-results'].entry.length;
    const startFormatted = formatNumber(start + 1);
    const endFormatted = formatNumber(end);
    const dataWithMeta = metadata(chunk, meta, 'chunk');
    chunk['search-results']['opensearch:startIndex'] = start.toString();
    chunk['search-results']['opensearch:itemsPerPage'] = chunk['search-results'].entry.length.toString();
    fs.writeFileSync(
      `${toJson}-${startFormatted}-${endFormatted}.json`,
      JSON.stringify(dataWithMeta, null, 2),
    );
    start = end;
    chunk['search-results'].entry = [];
  }
  while (next) {
    let infoString = `Retrieving page ${page}`;
    page += 1;
    const nextData = await GET(next['@href'], headers, {});
    infoObject.endTime = new Date().getTime();
    infoObject.timeTaken = (infoObject.endTime - infoObject.startTime) / 1000;
    infoObject.completionFraction = infoObject.currentApiRequestCallNumber
      / infoObject.totalNumberOfApiCallsNeeded;
    infoObject.estimatedTime = infoObject.timeTaken / infoObject.completionFraction;
    infoObject.remainingTime = infoObject.estimatedTime - infoObject.timeTaken;
    infoObject.remainingTimeFormated = new Date(infoObject.remainingTime * 1000)
      .toISOString().slice(11, 19);
    infoObject.currentApiRequestCallNumber += 1;
    infoString += `\n- Progress: ${Math.round((infoObject.currentApiRequestCallNumber / infoObject.totalNumberOfApiCallsNeeded) * 100)}%`;
    infoString += `\n- Remaining time: ${infoObject.remainingTimeFormated}`;
    const remainingQueries = nextData.headers['x-ratelimit-remaining'];
    infoString += `\n- Remaining queries: ${remainingQueries}`;
    chunk['search-results'].entry.push(...nextData.data['search-results'].entry);
    next = getNext(nextData.data['search-results'].link);
    if (chunk['search-results'].entry.length >= chunkSize || !next) {
      end = start + chunk['search-results'].entry.length;
      const startFormatted = formatNumber(start + 1);
      const endFormatted = formatNumber(end);
      chunk['search-results']['opensearch:startIndex'] = start.toString();
      chunk['search-results']['opensearch:itemsPerPage'] = chunk['search-results'].entry.length.toString();
      const dataWithMeta = metadata(chunk, meta, 'chunk');
      fs.writeFileSync(
        `${toJson}-${startFormatted}-${endFormatted}.json`,
        JSON.stringify(dataWithMeta, null, 2),
      );
      start = end;
      chunk['search-results'].entry = [];
      infoString += `\n- Results: ${chunk['search-results']['opensearch:itemsPerPage']}`;
      infoString += `\n- Output file: ${toJson}-${startFormatted}-${endFormatted}.json`;
    }
    console.log(infoString);
    fs.appendFileSync(`${toJson}.info.txt`, `${infoString}\n`);
  }
  return metadata(data, meta, 'original');
}

export async function testApi(apiKey: string) {
  try {
    await GET('https://api.elsevier.com/content/search/scopus', {
      'X-ELS-APIKey': apiKey,
    }, {});
  } catch (error) {
    const err = error as AxiosError;
    console.error(err.response?.data);
  }
}

export function checkLength(query: string, url: string) {
  const queryLength = query.length;
  const urlLength = url.length;
  const maxLength = 2800;

  const infoLength = `Query length: ${queryLength}\nURL length: ${urlLength}\nMax length: ${maxLength}`;
  console.log(infoLength);
  fs.writeFileSync('infoLength.txt', infoLength);
  if (urlLength > maxLength) {
    console.error(
      '\x1b[31m-->URL length is too long. Please reduce the query length\x1b[0m',
    );
    process.exit(1);
  }
}
