export type AbstractSearchRequest = {
  scopusId: string | string[];
  view?: 'META' | 'META_ABS' | 'FULL' | 'REF';
  toJson?: string;
};
