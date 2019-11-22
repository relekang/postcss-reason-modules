/* eslint-env jest */
let postcss = require('postcss');
let fs = require('fs');

let plugin = require('./');

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

async function run(input, output, opts, fileOpts) {
  let result = await postcss([plugin(opts)]).process(input, fileOpts);
  expect(result.css).toEqual(output);
  expect(result.warnings()).toHaveLength(0);
}

describe('postcss-reason-modules', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create file when input is file', async () => {
    await run(
      '.wrapper{ }',
      '.wrapper{ }',
      {},
      {
        from: '/tmp/postcss-reason-/modules/example/one.css',
      }
    );

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/tmp/postcss-reason-/modules/example/oneCss.re',
      '[@bs.module "./one.css"] external wrapper: string = "wrapper";'
    );
  });

  it('should not create file when input is file', async () => {
    await run('.wrapper{ }', '.wrapper{ }', {}, { from: undefined });

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should not create file when output is empty', async () => {
    await run(
      '',
      '',
      {},
      { from: '/tmp/postcss-reason-/modules/example/one.css' }
    );

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should not create file when output is empty', async () => {
    fs.readFileSync.mockImplementationOnce(
      () => '[@bs.module "./one.css"] external wrapper: string = "wrapper";'
    );
    await run(
      '.wrapper: {}',
      '.wrapper: {}',
      {},
      { from: '/tmp/postcss-reason-/modules/example/one.css' }
    );

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });

  it('should filter out pseudo class', async () => {
    await run(
      '.wrapper: {}\n.wrapper:hover{ }',
      '.wrapper: {}\n.wrapper:hover{ }',
      {},
      {
        from: '/tmp/postcss-reason-/modules/example/one.css',
      }
    );

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/tmp/postcss-reason-/modules/example/oneCss.re',
      '[@bs.module "./one.css"] external wrapper: string = "wrapper";'
    );
  });

  it('should handle joined classes', async () => {
    await run(
      '.wrapper.header{ }',
      '.wrapper.header{ }',
      {},
      {
        from: '/tmp/postcss-reason-/modules/example/one.css',
      }
    );

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/tmp/postcss-reason-/modules/example/oneCss.re',
      '[@bs.module "./one.css"] external wrapper: string = "wrapper";\n[@bs.module "./one.css"] external header: string = "header";'
    );
  });
});
