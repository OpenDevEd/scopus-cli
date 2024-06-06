import fs from 'fs';
import os from 'os';
import readlineSync from 'readline-sync';
import path from 'path';
import ScopusSDK from '../sdk/scopusSDK';
import { AbstractSearchRequest } from '../sdk/types/scopusAbstract';

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

export default async function abstract(args: any) {
  const { scopusIDs } = args;
  const scopusSDK = new ScopusSDK(getKey());
  const abstractArgs: AbstractSearchRequest = {
    scopusId: scopusIDs,
  };
  if (args.view) abstractArgs.view = args.view;
  if (args.save) abstractArgs.toJson = args.save;
  const res = await scopusSDK.abstract(abstractArgs);
  return res;
}
