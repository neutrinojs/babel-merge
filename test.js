const assert = require('assert');

const merge = require('./src');

describe('babel-merge', () => {
  it('should deeply merge preset options', () => {
    assert.deepEqual(
      merge(
        {
          presets: [
            ['@babel/env', {
              targets: {
                browsers: ['latest 1 Chrome']
              }
            }]
          ]
        },
        {
          presets: [
            ['@babel/env', {
              targets: {
                browsers: ['latest 1 Firefox']
              }
            }]
          ]
        }
      ),
      {
        presets: [
          [require.resolve('@babel/preset-env'), {
            targets: {
              browsers: [
                'latest 1 Chrome',
                'latest 1 Firefox'
              ]
            }
          }]
        ]
      }
    );
  });

  it('should merge by resolved name', () => {
    assert.deepEqual(
      merge(
        {
          presets: [
            [require.resolve('@babel/preset-env'), {
              targets: {
                browsers: ['latest 1 Chrome']
              }
            }]
          ]
        },
        {
          presets: [
            ['@babel/env', {
              targets: {
                browsers: ['latest 1 Firefox']
              }
            }]
          ]
        }
      ),
      {
        presets: [
          [require.resolve('@babel/preset-env'), {
            targets: {
              browsers: [
                'latest 1 Chrome',
                'latest 1 Firefox'
              ]
            }
          }]
        ]
      }
    );
  });

  it('should merge env options', () => {
    assert.deepEqual(
      merge(
        {
          env: {
            development: {
              presets: [
                [require.resolve('@babel/preset-env'), {
                  targets: {
                    browsers: ['latest 1 Chrome']
                  }
                }]
              ]
            }
          }
        },
        {
          env: {
            development: {
              presets: [
                ['@babel/env', {
                  targets: {
                    browsers: ['latest 1 Firefox']
                  }
                }]
              ]
            }
          }
        }
      ),
      {
        env: {
          development: {
            presets: [
              [require.resolve('@babel/preset-env'), {
                targets: {
                  browsers: [
                    'latest 1 Chrome',
                    'latest 1 Firefox'
                  ]
                }
              }]
            ]
          }
        }
      }
    );
  });

  it('should preserve plugin / preset order', () => {
    assert.deepEqual(
      merge(
        {
          plugins: [
            'module:fast-async',
            '@babel/plugin-syntax-dynamic-import'
          ]
        },
        {
          plugins: [
            '@babel/plugin-proposal-object-rest-spread',
            ['module:fast-async', { spec: true }],
            '@babel/plugin-proposal-class-properties'
          ]
        }
      ),
      {
        plugins: [
          [require.resolve('fast-async'), { 'spec': true }],
          require.resolve('@babel/plugin-syntax-dynamic-import'),
          require.resolve('@babel/plugin-proposal-object-rest-spread'),
          require.resolve('@babel/plugin-proposal-class-properties')
        ]
      }
    );
  });

  it('should merge an array of config objects', () => {
    assert.deepEqual(
      merge.all([
        {
          presets: [
            require.resolve('@babel/preset-env')
          ]
        },
        {
          presets: [
            '@babel/preset-env'
          ]
        },
        {
          presets: [
            '@babel/env'
          ]
        }
      ]),
      {
        presets: [
          require.resolve('@babel/preset-env')
        ]
      }
    );
  });

  it('should dedupe merged arrays', () => {
    assert.deepEqual(
      merge.all([
        {
          presets: [
            [require.resolve('@babel/preset-env'), {
              targets: {
                browsers: ['latest 1 Chrome']
              }
            }]
          ]
        },
        {
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: ['latest 1 Chrome']
              }
            }]
          ]
        },
        {
          presets: [
            ['@babel/env', {
              targets: {
                browsers: ['latest 1 Chrome']
              }
            }]
          ]
        }
      ]),
      {
        presets: [
          [require.resolve('@babel/preset-env'), {
            targets: {
              browsers: ['latest 1 Chrome']
            }
          }]
        ]
      }
    );
  });

  it('should support ES6+ data structures', () => {
    const a = {
      Symbol: [
        Symbol('1'),
        Symbol.for('2')
      ],
      Map: new Map([['a', 'a']]),
      Set: new Set(['a']),
      WeakMap: new WeakMap([[{ a: true }, 'a']]),
      WeakSet: new WeakSet([{ a: true }])
    };

    const b = {
      Symbol: [
        Symbol('1'),
        Symbol.for('2')
      ],
      Map: new Map([['b', 'b']]),
      Set: new Set(['b']),
      WeakMap: new WeakMap([[{ b: true }, 'b']]),
      WeakSet: new WeakSet([{ b: true }])
    };

    const c = {
      Symbol: [
        Symbol('1'),
        Symbol.for('2')
      ],
      Map: new Map([['c', 'c']]),
      Set: new Set(['c']),
      WeakMap: new WeakMap([[{ c: true }, 'c']]),
      WeakSet: new WeakSet([{ c: true }])
    };

    assert.deepStrictEqual(
      merge.all([
        { presets: [[require.resolve('@babel/preset-env'), a]] },
        { presets: [['@babel/preset-env', b]] },
        { presets: [['@babel/env', c]] }
      ]),
      {
        presets: [
          [require.resolve('@babel/preset-env'), {
            ...c,
            Symbol: [
              ...a.Symbol,
              b.Symbol[0],
              c.Symbol[0]
            ]
          }]
        ]
      }
    );
  });

  it('should support deepmerge option overrides', () => {
    assert.deepEqual(
      merge(
        {
          presets: [
            ['@babel/env', {
              targets: {
                browsers: new Set()
              }
            }]
          ]
        },
        undefined,
        { isMergeableObject: () => true }
      ),
      {
        presets: [
          ['@babel/env', {
            targets: {
              browsers: {}
            }
          }]
        ]
      }
    );

    assert.deepEqual(
      merge.all(
        [{
          presets: [
            ['@babel/env', {
              targets: {
                browsers: new Set()
              }
            }]
          ]
        }],
        { isMergeableObject: () => true }
      ),
      {
        presets: [
          ['@babel/env', {
            targets: {
              browsers: {}
            }
          }]
        ]
      }
    );
  });
});
