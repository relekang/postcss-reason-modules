let postcss = require('postcss');
let fs = require('fs');
let path = require('path');
let debug = require('debug')('postcss-reason-modules');
let pipe = require('lodash/fp/pipe');
let flatMap = require('lodash/fp/flatMap');
let map = require('lodash/fp/map');
let filter = require('lodash/fp/filter');

let counter = 0;
function dd(v) {
  debug(counter++, v);
  return v;
}

function classesFromNodes(nodes) {
  return Array.from(
    new Set(
      pipe([
        map(rule => rule.selector),
        filter(selector => selector && !selector.includes(':global')),
        flatMap(selector => (selector || '').split(' ')),
        dd,
        flatMap(selector => (selector || '').split(' ')),
        dd,
        map(selector => selector.replace(/:.*$/, '')),
        dd,
        filter(selector => /^(\.[a-zA-Z0-9]+)+$/.test(selector)),
        dd,
        flatMap(selector => selector.split('.')),
        dd,
        filter(selector => selector !== ''),
        dd,
        map(selector => selector.replace('.', '')),
      ])(nodes)
    )
  );
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
      fs.writeFileSync(filename, content);
      debug(`Wrote file to ${filename}`);
    }
  };
});
