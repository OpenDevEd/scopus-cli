import fs from 'fs';
import ScopusSDK from '../../scopusSDK';
import { ScopusSearchRequest } from '../../types/scopusSearchRequest';

function getKey() {
  const key = fs.readFileSync('scopus-api-key.txt', 'utf8');
  return key.trim();
}

async function saveAndSearch(scopusOptions: ScopusSearchRequest) {
  fs.writeFileSync('scopusOptions.json', JSON.stringify(scopusOptions, null, 2));
  const scopusSDK = new ScopusSDK(getKey());
  const res = await scopusSDK.search(scopusOptions);
  return res;
}

export default async function search(args: any) {
  const scopusOptions: ScopusSearchRequest = {
    query: args.searchQuery.join(' '),
  };
  if (args.save) {
    scopusOptions.toJson = args.save;
  }

  scopusOptions.retriveAllPages = !!args.allpages;

  const res = await saveAndSearch(scopusOptions);
  console.log(res);
}
