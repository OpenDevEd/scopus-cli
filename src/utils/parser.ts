import fs from 'fs';
import os from 'os';
import readlineSync from 'readline-sync';
import path from 'path';
import ScopusSDK from '../sdk/scopusSDK';
import { ScopusSearchRequest } from '../sdk/types/scopusSearchRequest';

function getKey() {
  const keyFile = `${os.homedir()}/.config/scopus-cli/scopus-api-key.txt`;

  if (!fs.existsSync(keyFile)) {
    const key = readlineSync.question('Enter your Scopus API key: ');

    // Create parent directories if they do not exist
    const keyDir = path.dirname(keyFile);
    fs.mkdirSync(keyDir, { recursive: true });

    fs.writeFileSync(keyFile, key);
    return key.trim();
  }

  const key = fs.readFileSync(keyFile, 'utf8');
  return key.trim();
}

function setKey(key: string) {
  const keyFile = `${os.homedir()}/.config/scopus-cli/scopus-api-key.txt`;
  const keyDir = path.dirname(keyFile);
  fs.mkdirSync(keyDir, { recursive: true });
  fs.writeFileSync(keyFile, key);
}

function sanitise(str: string) {
  let term = str;
  term = term.replace(/\t+/gs, ' ');
  term = term.replace(/ +/gs, ' ');
  term = term.replace(/^ +/gs, '');
  term = term.replace(/ +$/gs, '');
  return term;
}

function quoteIfNeeded(term: string) {
  let t = term;
  if (t.match(/ /) && !t.match(/^".*"$/)) {
    t = `"${t}"`;
  }
  return t;
}

function searchBuilder(query: any) {
  let searchQuery = '';

  for (let i = 0; i < query.length; i += 1) {
    if (query[i].match(/(\w+)\.\.\./)) {
      const key = query[i].match(/(\w+)\.\.\./)[1];
      // open a file
      const file = `searchterms/${key}.txt`;
      let result = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : key;
      // split result into an array by new line
      const resultarr = result.split(/\r?\n/);
      result = '';
      let operator = '';
      let useoperator = false;
      // remove comments from results file
      for (let j = 0; j < resultarr.length; j += 1) {
        if (resultarr[j].match(/#(OR|AND)\s*$/)) {
          operator = `${resultarr[j].match(/#(OR|AND)\s*$/)[1]} `;
          useoperator = true;
        }
        if (resultarr[j].match(/#(-)\s*$/)) {
          useoperator = true;
          operator = ' ';
          console.log('operator empty.');
        }
        const term = sanitise(resultarr[j].replace(/#.+$/g, ''));
        if (term !== '') {
          result
            += `${(result.match(/[\w")]\s+$/) && !term.match(/^\s*\)/) ? operator : '')
            + (useoperator ? quoteIfNeeded(term) : term)
            } `;
        }
      }
      result = query[i].replace(RegExp(`${key}\\.\\.\\.`), result);
      searchQuery += ` ${result}`;
    } else {
      searchQuery += ` ${quoteIfNeeded(query[i])}`;
    }
  }
  // Allow use of [ and ] instead of ( and ).
  searchQuery = searchQuery.replace(/\[/gs, '(');
  searchQuery = searchQuery.replace(/\]/gs, ')');
  return searchQuery;
}

function buildQuery(query: any, title?:boolean, titleAndAbstract?:boolean) {
  let searchQuery = searchBuilder(query);
  if (title) {
    searchQuery = `TITLE(${searchQuery})`;
  }
  if (titleAndAbstract) {
    searchQuery = `TITLE-ABS-KEY(${searchQuery})`;
  }
  console.log('Final query:', searchQuery);
  return searchQuery;
}

async function saveAndSearch(scopusOptions: ScopusSearchRequest) {
  fs.writeFileSync('scopusOptions.json', JSON.stringify(scopusOptions, null, 2));
  const scopusSDK = new ScopusSDK(getKey());
  const res = await scopusSDK.search(scopusOptions);
  return res;
}

async function handleCount(scopusOptions: ScopusSearchRequest) {
  scopusOptions.perPage = 1;
  scopusOptions.page = 1;
  const results = await saveAndSearch(scopusOptions);
  console.log('count:', results.data['search-results']['opensearch:totalResults']);
  return results.data['search-results']['opensearch:totalResults'];
}

export default async function search(args: any) {
  if (args.apiKey) {
    setKey(args.apiKey);
  }
  let query = args.searchQuery;
  if (args.searchstringfromfile) {
    if (!fs.existsSync(args.searchstringfromfile)) {
      console.log(`File not found: ${args.searchstringfromfile}`);
      process.exit(1);
    }
    query = fs.readFileSync(args.searchstringfromfile, 'utf8');
    query = query.split(/\r?\n/);
  }
  const scopusOptions: ScopusSearchRequest = {
    query: buildQuery(query, args.title, args.titleabs).trim(),
  };
  if (args.count) {
    const res = await handleCount(scopusOptions);
    return res;
  }
  if (args.keyinfo) {
    const scopusSDK = new ScopusSDK(getKey());
    await scopusSDK.testKey(scopusOptions.query);
    return undefined;
  }
  if (args.view) {
    scopusOptions.view = args.view;
  }

  if (args.save) {
    scopusOptions.toJson = args.save;
  }

  if (args.autosave) {
    const filename = scopusOptions.query?.trim().split('  ').join(' ');
    scopusOptions.toJson = filename;

    if (args.time) {
      // Y-M-D_H:M:S
      const date = new Date().toISOString().replace('T', '_').replace(/\..+/, '');
      scopusOptions.toJson = `${date}-${filename}`;
    }
    args.save = scopusOptions.toJson;
  }

  if (args.perPage) {
    scopusOptions.perPage = args.perPage;
  }

  if (args.chunkSize) {
    scopusOptions.chunkSize = args.chunkSize;
  }
  scopusOptions.retriveAllPages = !!args.allpages;

  const res = await saveAndSearch(scopusOptions);
  if (args.save || args.autosave) {
    const configJson = {
      date: new Date().toISOString().replace('T', ' ').replace(/\..+/, ''),
      ...scopusOptions,
    };
    fs.writeFileSync(`${scopusOptions.toJson}.config.json`, JSON.stringify(configJson, null, 2));
  } else {
    console.log(JSON.stringify(res.data, null, 2));
  }
  return res.data;
}
