let postcss = require('postcss');
let fs = require('fs');
let debug = require('debug')('postcss-reason-modules');

module.exports = postcss.plugin('postcss-reason-modules', (opts = {}) => {
  return (root, result) => {
    debug(root);
    debug(result);
    if (!result.opts.file) {
      return;
    }

    const basename = result.opts.file.basename;
    const filename = result.opts.from.replace(/\.css$/, 'Css.re');

    const classes = root.nodes
      .map(rule => rule.selector)
      .filter(selector => /^\.[a-zA-Z0-9]/.test(selector))
      .map(selector => selector.replace('.', ''));

    const content = classes
      .map(
        name =>
          `[@bs.module "./${basename}"] external ${name}: string = "${name}";`
      )
      .join('\n');

    fs.writeFileSync(filename, content);
  };
});
