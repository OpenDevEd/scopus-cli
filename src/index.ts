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
        .option('title', {
          describe: 'Search only in title',
          type: 'boolean',
        })
        .option('titleabs', {
          describe: 'Search only in title and abstract',
          type: 'boolean',
        })
        .option('view', {
          describe: 'This alias represents the list of elements that will be returned in the response.',
          choices: ['STANDARD', 'COMPLETE'],
          default: 'STANDARD',
        })
        .option('count', {
          describe: 'Count of the search results',
          type: 'boolean',
        })
        .option('perPage', {
          describe: 'Number of items per page',
          type: 'number',
        })
        .option('chunkSize', {
          describe:
            'this option only works with --allpages. It will retrieve the results in chunks of the specified size. E.g. --chunkSize=100 will retrieve 100 results at a time. and save them to files in a folder with same name in --save option,',
          type: 'number',
        })
        .option('time', {
          describe: 'Time of the search',
          type: 'boolean',
          default: true,
        })
        .option('searchstringfromfile', {
          describe: 'Search string read from file.',
          type: 'string',
        })
        .option('autosave', {
          describe: 'Save the search results to a json file with the search string as the filename',
          type: 'boolean',
        })
        .option('apiKey', {
          describe: 'API key',
          type: 'string',
        })
        .option('keyCapabilities', {
          describe: 'Key capabilities',
          type: 'string',
        });
    },
  )
  .middleware(async (argv) => {
    if (!argv.searchQuery) {
      console.error('Search query is required');
      process.exit(1);
    }
    if (!argv.searchQuery && !argv.searchstringfromfile) {
      console.log('Please provide a search string (positional args) or use --searchstringfromfile=file.txt.');
      process.exit(1);
    }
    if (argv.title && argv.titleabs) {
      console.log('Please provide only one search field --title or --title_and_abstract.');
      process.exit(1);
    }
    if (argv.save && argv.time) {
      argv.time = false;
    }
    if (argv.save && argv.autosave) {
      console.log('Please provide only one of --save or --autosave.');
      process.exit(1);
    }
    await search(argv);
  })
  .parse();
