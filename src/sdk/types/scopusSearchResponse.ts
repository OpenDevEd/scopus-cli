export interface ReturnWithMeta {
  meta: {
    version: string;
    query: string;
    searchTerm: string;
    totalResults: string;
    source: string;
    sourceFormat: string;
    date: string;
    searchScope: string;
    page: number;
    resultsPerPage: string;
    firstItem: string;
    startingPage: string;
    endingPage?: string;
    filters: object;
    groupBy: string;
    sortBy: {
      field: string;
      order: string;
    };
  };
  resutls: ScopusSearchResponse;
}

// Main Interface
export interface ScopusSearchResponse {
  'search-results': SearchResults;
}

// Search Results Interface
interface SearchResults {
  'opensearch:totalResults': string;
  'opensearch:startIndex': string;
  'opensearch:itemsPerPage': string;
  'opensearch:Query': OpenSearchQuery;
  'link': Link[];
  'entry': Entry[];
}

// OpenSearch Query Interface
interface OpenSearchQuery {
  '@role': string;
  '@searchTerms': string;
  '@startPage': string;
}

// Link Interface
export interface Link {
  '@_fa': string;
  '@ref': string;
  '@href': string;
  '@type'?: string;
}

// Entry Interface (Represents each search result)
interface Entry {
  '@_fa': string;
  'link': Link[];
  'prism:url': string;
  'dc:identifier': string;
  'dc:title': string;
  'dc:creator': string;
  'prism:publicationName': string;
  'prism:issn': string;
  'prism:eIssn'?: string;
  'prism:volume': string;
  'prism:pageRange'?: string;
  'prism:coverDate': string;
  'prism:coverDisplayDate': string;
  'prism:doi': string;
  'dc:description': string;
  'citedby-count': string;
  'affiliation': Affiliation[];
  'prism:aggregationType': string;
  'subtype': string;
  'subtypeDescription': string;
  'author': Author[];
  'authkeywords': string;
  'prism:issueIdentifier'?: string; // Added for potential issue identifier
}

// Affiliation Interface
interface Affiliation {
  '@_fa': string;
  'affiliation-url': string;
  'afid': string;
  'affilname': string;
  'affiliation-city': string;
  'affiliation-country': string;
  'name-variant': NameVariant[];
}

// Name Variant Interface
interface NameVariant {
  '@_fa': string;
  '$': string;
}

// Author Interface
interface Author {
  '@_fa': string;
  'author-url': string;
  'authid': string;
  'authname': string;
  'surname': string;
  'initials': string;
  'given-name'?: string; // Added for potential given name
  'afid': string[];
}
