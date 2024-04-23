#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import search from './utils/parser';

yargs(hideBin(process.argv))
  .command(
    'search [searchQuery...]',
    'Search for a query in Scopus, This represents the boolean search to be executed against the SCOPUS cluster.',
    (yargsParam) => {
      yargsParam
        .option('save', {
          describe: 'Save the search results to a json file. E.g. --save=test will save results to test.json',
          type: 'string',
        })
        .option('allpages', {
          describe: 'Fetch all pages of the search results',
          type: 'boolean',
        })
        .option('view', {
          describe: 'This alias represents the list of elements that will be returned in the response.',
          choices: ['STANDARD', 'COMPLETE'],
        })
        .option('fields', {
          describe: 'This represents the list of fields to be returned in the response.',
          choices: ['dc:identifier', 'eid', 'dc:title', 'dc:creator', 'prism:publicationName'],
          type: 'array',
        });
    },
  )
  .middleware(async (argv) => {
    if (!argv.searchQuery) {
      console.error('Search query is required');
      process.exit(1);
    }
    await search(argv);
  })
  .parse();
