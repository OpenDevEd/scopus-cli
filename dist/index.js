#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs/yargs"));
const helpers_1 = require("yargs/helpers");
const parser_1 = __importDefault(require("./utils/parser"));
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command('search [searchQuery...]', 'Search for a query in Scopus, This represents the boolean search to be executed against the SCOPUS cluster.', (yargsParam) => {
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
        .option('title_and_abstract', {
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
        describe: 'this option only works with --allpages. It will retrieve the results in chunks of the specified size. E.g. --chunkSize=100 will retrieve 100 results at a time. and save them to files in a folder with same name in --save option,',
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
    });
})
    .middleware((argv) => __awaiter(void 0, void 0, void 0, function* () {
    if (!argv.searchQuery) {
        console.error('Search query is required');
        process.exit(1);
    }
    if (!argv.searchQuery && !argv.searchstringfromfile) {
        console.log('Please provide a search string (positional args) or use --searchstringfromfile=file.txt.');
        process.exit(1);
    }
    if (argv.title && argv.title_and_abstract) {
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
    yield (0, parser_1.default)(argv);
}))
    .parse();
//# sourceMappingURL=index.js.map