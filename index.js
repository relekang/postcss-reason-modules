let postcss = require('postcss');
let fs = require('fs');
let path = require('path');
let debug = require('debug')('postcss-reason-modules');

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

    const classes = Array.from(
      new Set(
        root.nodes
          .map(rule => (rule.selector || '').replace(/:.*$/, ''))
          .filter(selector => /^\.[a-zA-Z0-9]+$/.test(selector))
          .map(selector => selector.replace('.', ''))
      )
    );

    debug(`classes: ${JSON.stringify(classes)}`);

    const content = classes
      .map(
        name =>
          `[@bs.module "./${basename}"] external ${name}: string = "${name}";`
      )
      .join('\n');

    fs.writeFileSync(filename, content);
    debug(`Wrote file to ${filename}`);
  };
});
