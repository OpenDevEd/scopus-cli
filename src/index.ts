import fs from 'fs';
import ScopusSDK from './scopusSDK';

async function main() {
  const scopusSDK = new ScopusSDK('640b386af562c2438a0166e47a74d4c7');
  const res = await scopusSDK.search({
    query: 'heart attack OR text(liver)',
    count: 1,
    field: ['affiliation.afid', 'author.afid', 'article-number'],
    toJson: 'heartData3',
  });

  console.log(res.data);
  fs.writeFileSync('response.json', JSON.stringify(res.data, null, 2));
}

main();
