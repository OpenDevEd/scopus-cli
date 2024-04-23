import fs from 'fs';
import ScopusSDK from '../../scopusSDK';
import { ScopusSearchRequest } from '../../types/scopusSearchRequest';

function getKey() {
  const key = fs.readFileSync('scopus-api-key.txt', 'utf8');
  return key.trim();
}

export default async function search(args: any) {
  const scopusSDK = new ScopusSDK(getKey());
  const scopusOptions: ScopusSearchRequest = {
    query: args.searchQuery.join(' '),
  };
  if (args.save) {
    scopusOptions.toJson = args.save;
  }

  scopusOptions.retriveAllPages = !!args.allpages;

  const res = await scopusSDK.search(scopusOptions);
  console.log(res);
}
