import { promises as fs } from 'fs';
import path from 'path';

import jsdom from 'jsdom';
import type { FetchOptions, ResourceLoaderConstructorOptions } from 'jsdom';
const { JSDOM, ResourceLoader } = jsdom;

class FileResourceLoader extends ResourceLoader {
  rootURL = '';
  rootDirectory = '';
  constructor(options: ResourceLoaderConstructorOptions
    & { rootURL: string, rootDirectory: string}
  ) {
    super(options);
    this.rootURL = options.rootURL;
    this.rootDirectory = path.resolve(options.rootDirectory);
  }
  fetch(url: string, options: FetchOptions) {
    const { pathname } = new URL(url);
    console.log(options.element, 'requesting', url);
    if (pathname) {
      console.log('File', pathname);
      return fs.readFile(path.normalize(`${this.rootDirectory}/${pathname}`));
    }
    console.log('Network', url);
    return super.fetch(url, options);
  }
}

const SITE = 'https://stayknit.ca';
const ROOT = './serve';

const resourceLoader = new FileResourceLoader({
  rootURL: SITE,
  rootDirectory: ROOT,
});

(async () => {
  const { window } = await JSDOM.fromFile(`${ROOT}/index.html`, {
    url: SITE,
    resources: resourceLoader,
    runScripts: 'dangerously',
  });

  // TODO: Sad this doesn't do everything only <body/>
  const html = window.document.body.outerHTML;
  await fs.writeFile('ssr.html', html);
  // Unhandled promise rejection: openedRequest.onabort is not a function
  // window.close();
})();
