import { parseString } from 'xml2js';

export default function xmlToJson(xml: string) {
  parseString(xml, { explicitArray: false }, (error, result) => {
    console.log(result);
  });
}
