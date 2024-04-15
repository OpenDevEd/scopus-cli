import fs from 'fs';
import ScopusSDK from './Scopus-SDK';

async function main() {
  const scopusSDK = new ScopusSDK('640b386af562c2438a0166e47a74d4c7');
  const res = await scopusSDK.search('heart attack OR text(liver)');

  console.log(res.data);
  fs.writeFileSync('response.json', JSON.stringify(res.data, null, 2));
}

main();
