#!/usr/bin/env node
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import search from './utils/search';
import setApiKey from './utils/config';
import abstract from './utils/abstract';

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
        // .option('title', {
        //   describe: 'Search only in title',
        //   type: 'boolean',
        // })
        // .option('title-abs', {
        //   describe: 'Search only in title and abstract',
        //   type: 'boolean',
        // })
        .option('field', {
          describe: 'Search only in the specified field, multiple fields are separated by a comma. E.g. title,abstract or ti,ab. The available fields are: title | ti, abstract | ab, keywords | ke',
          type: 'string',
          default: 'title,abstract,keywords',
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
        .option('limit', {
          describe: 'Number of items to retrieve',
          type: 'number',
        })
        .option('chunkSize', {
          describe:
            'This option will retrieve the results in chunks of the specified size. E.g. --chunkSize=100 will retrieve 100 results at a time. and save them to files in a folder with same name in --save option,',
          type: 'number',
        })
        .option('time', {
          describe: 'Append the time of the search to the name of the auto-saved file',
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
        .option('date', {
          describe: 'Date of the search, either a year or a range of years separated by a hyphen. E.g. 2019-2020',
          type: 'string',
        })
        .option('sort-by', {
          describe: 'Sort the search results by relevance or date in ascending or descending order. E.g. relevance, date',
          choices: ['relevance', 'date'],
          default: 'relevance',
        })
        .option('sort-order', {
          describe: 'Sort the search results by relevance or date in ascending or descending order. E.g. asc, desc',
          choices: ['asc', 'desc'],
          default: 'desc',
        })
        .option('keyinfo', {
          describe: 'Key capabilities',
          type: 'boolean',
        })
        .option('keyType', {
          describe: 'Key type',
          choices: ['Developer', 'Institutional'],
          default: 'Developer',
        });
    },
  )
  .command(
    'config set api-key',
    'Set the API key to be used for the search',
  )
  .command(
    'abstract [scopusIDs...]',
    'Get abstracts for a list of Scopus IDs',
    (yargsParam) => {
      yargsParam
        .option('save', {
          describe: 'Save the search results to a json file. E.g. --save=test will save results to test.json',
          type: 'string',
        })
        .option('view', {
          describe: 'This alias represents the list of elements that will be returned in the response.',
          choices: ['META', 'META_ABS', 'FULL', 'REF'],
          default: 'META',
        });
    },
  )
  .middleware(async (argv) => {
    if (argv._[0] === 'config') {
      console.log('Config command');
      await setApiKey();
      process.exit(0);
    }
    if (argv._[0] === 'search') {
      if (!argv.searchQuery) {
        console.error('Search query is required');
        process.exit(1);
      }
      if (!argv.searchQuery && !argv.searchstringfromfile) {
        console.log('Please provide a search string (positional args) or use --searchstringfromfile=file.txt.');
        process.exit(1);
      }
      // if (!argv.title && !argv.titleAbs) {
      //   argv.titleAbs = true;
      // }
      // if (argv.title && argv.titleAbs) {
      //   console.log('Please provide only one search field --title or --title_and_abstract.');
      //   process.exit(1);
      // }
      if (typeof argv.field === 'string') {
        const fields = argv.field.split(',');
        const validFields = ['title', 'abstract', 'keywords', 'ti', 'ab', 'ke', 'all'];
        for (let i = 0; i < fields.length; i += 1) {
          fields[i] = fields[i].trim();
          if (!validFields.includes(fields[i])) {
            console.log('Invalid field:', fields[i]);
            process.exit(1);
          }
        }
        argv.field = fields;
      }
      if (argv.save && argv.time) {
        argv.time = false;
      }
      if (argv.save && argv.autosave) {
        console.log('Please provide only one of --save or --autosave.');
        process.exit(1);
      }
      if (argv.config) {
        argv.apiKey = argv.config;
      }
      if (argv.chunkSize && !argv.save) {
        console.log('Please provide --save option with --chunkSize option.');
        process.exit(1);
      }
      await search(argv);
    }
    if (argv._[0] === 'abstract') {
      if (!argv.scopusIDs) {
        console.error('Scopus IDs are required');
        process.exit(1);
      }
      await abstract(argv);
    }
  })
  .parse();
