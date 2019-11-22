let postcss = require('postcss');
let fs = require('fs');
let path = require('path');
let debug = require('debug')('postcss-reason-modules');
let pipe = require('lodash/fp/pipe');
let flatMap = require('lodash/fp/flatMap');
let map = require('lodash/fp/map');
let filter = require('lodash/fp/filter');

let counter = 0;
function debugWrapper(v) {
  debug(counter++, v);
  return v;
}

function classesFromNodes(nodes) {
  counter = 0;
  return Array.from(
    new Set(
      pipe([
        map(rule => rule.selector),
        filter(selector => selector && !selector.includes(':global')),
        flatMap(selector => (selector || '').split(' ')),
        debugWrapper,
        flatMap(selector => (selector || '').split(' ')),
        debugWrapper,
        map(selector => selector.replace(/:.*$/, '')),
        debugWrapper,
        filter(selector => /^(\.[a-zA-Z0-9]+)+$/.test(selector)),
        debugWrapper,
        flatMap(selector => selector.split('.')),
        debugWrapper,
        filter(selector => selector !== ''),
        debugWrapper,
        map(selector => selector.replace('.', '')),
      ])(nodes)
    )
  );
}

function readFile(path) {
  try {
    return fs.readFileSync(path);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      debug('Error reading file', path, error);
    }
    return;
  }
}

module.exports = postcss.plugin('postcss-reason-modules', (_opts = {}) => {
  return (root, result) => {
    debug('nodes:', root.nodes);
    debug('result.opts.from:', result.opts.from);
    if (!result.opts.from) {
      debug('Missing result.opts.from so will not create file for this one');
      return;
    }
    const filePath = result.opts.from;
    const filename = filePath.replace(/\.css$/, 'Css.re');
    const basename = path.basename(filePath);

    debug('basename:', basename);

    debug(
      'selectors:',
      root.nodes.map(({ selector }) => selector)
    );

    const classes = classesFromNodes(root.nodes);

    debug(`classes: ${JSON.stringify(classes)}`);

    const content = classes
      .map(
        name =>
          `[@bs.module "./${basename}"] external ${name}: string = "${name}";`
      )
      .join('\n');

    if (content === '') {
      debug(`Did not create empty file`);
    } else {
      const previousContent = readFile(filename);
      if (previousContent === content) {
        debug('Content is the same, not writing file');
      } else {
        fs.writeFileSync(filename, content);
        debug(`Wrote file to ${filename}`);
      }
    }
  };
});
