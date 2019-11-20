/* eslint-env jest */
let postcss = require('postcss');
let fs = require('fs');

let plugin = require('./');

jest.mock('fs');

async function run(input, output, opts, fileOpts) {
  let result = await postcss([plugin(opts)]).process(input, fileOpts);
  expect(result.css).toEqual(output);
  expect(result.warnings()).toHaveLength(0);
}

beforeEach(() => {
  jest.clearAllMocks();
});

test('Plugin creates file when input is file', async () => {
  await run(
    '.wrapper{ }',
    '.wrapper{ }',
    {},
    {
      from: '/tmp/postcss-reason-/modules/example/one.css',
      file: {
        dirname: '/tmp/postcss-reason-/modules/example',
        basename: 'one.css',
        extname: '.css',
      },
    }
  );

  expect(fs.writeFileSync).toHaveBeenCalledWith(
    '/tmp/postcss-reason-/modules/example/oneCss.re',
    '[@bs.module "./one.css"] external wrapper: string = "wrapper";'
  );
});

test('Plugin does not create file when input is file', async () => {
  await run('.wrapper{ }', '.wrapper{ }', {}, { from: undefined });

  expect(fs.writeFileSync).not.toHaveBeenCalled();
});
