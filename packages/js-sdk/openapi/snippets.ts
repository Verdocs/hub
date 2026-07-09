import {Preamble} from './Preamble';
import {capitalize} from '../src';

const BASE_URL = Preamble.servers[0].url;

export const generateSnippets = (
  method: string,
  url: string,
  {showQuery, showBody}: {showQuery: boolean; showBody: boolean} = {showQuery: false, showBody: false},
) => {
  const snippets = [];

  const capitalizedMethod = capitalize(method);
  const upperMethod = method.toUpperCase();
  const lowerMethod = method.toLowerCase();
  const urlWithParams = url.replace(/{([^}]*)}/g, (_, key) => key.toUpperCase());
  const urlWithQuery = `${BASE_URL}${urlWithParams}${showQuery ? '?param=value' : ''}`;

  // Lang must be from https://github.com/github-linguist/linguist/blob/main/lib/linguist/popular.yml

  snippets.push({
    lang: 'Shell',
    label: 'CURL',
    source: `curl -X ${upperMethod} "${urlWithQuery}" \\
    -H "Authorization: Bearer ACCESS_TOKEN" \\
    -H "content-type: application/json" ${showBody ? '\\\n    -d \'{"param": "value"}\'' : ''}`,
  });

  if (upperMethod === 'GET') {
    snippets.push({
      lang: 'TypeScript',
      label: 'NodeJS',
      source: `import fetch from 'node-fetch';

const response = await fetch('${urlWithQuery}', { 
  headers: {
    'Content-Type': 'application/json',
    'Authorization: Bearer ACCESS_TOKEN'
  } 
});
const data = await response.json();
console.log(data);`,
    });
  } else {
    snippets.push({
      lang: 'TypeScript',
      label: 'NodeJS',
      source: `import fetch from 'node-fetch';

const response = await fetch('${urlWithQuery}', {
  method: '${lowerMethod}',
  body: JSON.stringify(body),
  headers: {
    'Content-Type': 'application/json',
    'Authorization: Bearer ACCESS_TOKEN'
  },
});

const data = await response.json();
console.log(data);`,
    });
  }

  snippets.push({
    lang: 'Ruby',
    label: 'Ruby',
    source: `require 'uri'
require 'net/http'
require 'openssl'

url = URI("${urlWithQuery}")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::${capitalizedMethod}.new(url)
request["content-type"] = 'application/json'
request["Authorization"] = 'Bearer ACCESS_TOKEN'

response = http.request(request)
puts response.read_body`,
  });

  snippets.push({
    lang: 'Python',
    label: 'Python',
    source: `import http.client

conn = http.client.HTTPSConnection("${BASE_URL.replace('https://', '')}")
headers = {
    'content-type': "application/json",
    'Authorization': "Bearer ACCESS_TOKEN"
}

conn.request("${upperMethod}", "${url}", headers=headers)

res = conn.getresponse()
data = res.read()
print(data.decode("utf-8"))
`,
  });

  snippets.push({
    lang: 'C#',
    label: 'C-Sharp',
    source: `var client = new RestClient("${urlWithQuery}");
var request = new RestRequest(Method.${upperMethod});
request.AddHeader("content-type", "application/json");
request.AddHeader("Authorization", "Bearer ACCESS_TOKEN");

IRestResponse response = client.Execute(request);`,
  });

  snippets.push({
    lang: 'Java',
    label: 'Java',
    source: `HttpResponse<String> response = Unirest.${lowerMethod}("${urlWithQuery}")
  .header("content-type", "application/json")
  .header("Authorization", "Bearer ACCESS_TOKEN")
  .asString();`,
  });

  return snippets;
};
