// Main Interface
export interface ScopusSearchRequest {
  httpAccept?: 'application/json' | 'application/xml' | 'application/atom+xml';
  access_token?: string;
  insttoken?: string;
  apiKey?: string;
  reqId?: string;
  ver?: 'facetexpand' | 'allexpand' | 'new';
  query: string;
  view?: 'STANDARD' | 'COMPLETE';
  field?: Field | Field[];
  suppressNavLinks?: boolean;
  /**
   * Represents the date range associated with the search, with the lowest granularity being year.
   * @example date='2002-2007'
   */
  date?: string;
  start?: number;
  count?: number;
  // sort=+artnum,-coverDate,creator
  sort?: Sorting | Sorting[];
  content?: 'all' | 'core' | 'dummy';
  /**
   * Represents the subject area of the search.
   * @value AGRI - Agricultural and Biological Sciences
   * @value ARTS - Arts and Humanities
   * @value BIOC - Biochemistry, Genetics and Molecular Biology
   * @value BUSI - Business, Management and Accounting
   * @value CENG - Chemical Engineering
   * @value CHEM - Chemistry
   * @value COMP - Computer Science
   * @value DECI - Decision Sciences
   * @value DENT - Dentistry
   * @value EART - Earth and Planetary Sciences
   * @value ECON - Economics, Econometrics and Finance
   * @value ENER - Energy
   * @value ENGI - Engineering
   * @value ENVI - Environmental Science
   * @value HEAL - Health Professions
   * @value IMMU - Immunology and Microbiology
   * @value MATE - Materials Science
   * @value MATH - Mathematics
   * @value MEDI - Medicine
   * @value NEUR - Neuroscience
   * @value NURS - Nursing
   * @value PHAR - Pharmacology, Toxicology and Pharmaceutics
   * @value PHYS - Physics and Astronom
   * @value PSYC - Psychology
   * @value SOCI - Social Sciences
   * @value VETE - Veterinary
   * @value MULT - Multidisciplinary
   */
  subj?: Subj | Subj[];
  alias?: 'true' | 'false';
  cursor?: string;
  // facets=authname(count=20,sort=na,prefix=Ma);exactsrctitle(prefix=J);subjarea(sort=fd);pubyear;srctype(sort=fdna)
  facets?: Facet[];
}

type Field = 'prism:url'
| 'dc:identifier'
| 'eid'
| 'dc:title'
| 'prism:aggregationType'
| 'subtype'
| 'subtypeDescription'
| 'citedby-count'
| 'prism:publicationName'
| 'prism:isbn'
| 'prism:issn'
| 'prism:volume'
| 'prism:issueIdentifier'
| 'prism:pageRange'
| 'prism:coverDate'
| 'prism:coverDisplayDate'
| 'prism:doi'
| 'pii'
| 'pubmed-id'
| 'orcid'
| 'dc:creator'
| 'openaccess:openaccessFlag'
| 'affiliation:affilname'
| 'affiliation:affiliation-city'
| 'affiliation:affiliation-country'
| 'affiliation:afid'
| 'affiliation:affiliation-url'
| 'affiliation:name-variant'
| 'author:author-url'
| 'author:authid'
| 'author:orcid'
| 'author:authname'
| 'author:given-name'
| 'author:surname'
| 'author:initials'
| 'author:afid'
| 'dc:description'
| 'authkeywords'
| 'article-number'
| 'fund-acr'
| 'fund-no'
| 'fund-sponsor'

type Sorting = {
  field: 'artnum' | 'citedby-count' | 'coverDate' | 'creator' | 'orig-load-date' | 'pagecount' | 'pagefirst' | 'pageRange' | 'publicationName' | 'pubyear' | 'relevancy' | 'volume';
  order: 'asc' | 'desc';
};

type Facet = ('af-id' | 'aucite' | 'au-id' | 'authname' | 'country' | 'exactsrctitle' | 'fund-sponsor' | 'language' | 'openaccess' | 'pubyear' | 'restype' | 'srctype' | 'subjarea');

type Subj = 'AGRI' | 'ARTS' | 'BIOC' | 'BUSI' | 'CENG' | 'CHEM' | 'COMP' | 'DECI' | 'DENT' | 'EART' | 'ECON' | 'ENER' | 'ENGI' | 'ENVI' | 'HEAL' | 'IMMU' | 'MATE' | 'MATH' | 'MEDI' | 'NEUR' | 'NURS' | 'PHAR' | 'PHYS' | 'PSYC' | 'SOCI' | 'VETE' | 'MULT';