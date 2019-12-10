const omit = require('object.omit');
const merge = require('deepmerge');
const simpleMerge = require('lodash.merge');
const { resolvePlugin, resolvePreset } = require('@babel/core');

function arrayMerge(source = [], overrides = []) {
  return [...new Set([...source, ...overrides])];
}

function mergeArray(source = [], overrides = [], resolve) {
  return [...source, ...overrides].reduce((reduction, override) => {
    const overrideName = resolve(Array.isArray(override) ? override[0] : override);
    const overrideOptions = Array.isArray(override) ? override[1] : {};
    const base = reduction.find((base) => {
      const baseName = resolve(Array.isArray(base) ? base[0] : base);
      return baseName === overrideName || baseName.includes(overrideName);
    });

    const index = base ? reduction.indexOf(base) : reduction.length;
    const baseName = base ? resolve(Array.isArray(base) ? base[0] : base) : overrideName;
    const baseOptions = Array.isArray(base) ? base[1] : {};
    const options = simpleMerge(baseOptions, overrideOptions);

    reduction[index] = Object.keys(options).length ? [baseName, options] : baseName;

    return reduction;
  }, []);
}

function babelMerge(source = {}, overrides = {}) {
  const plugins = mergeArray(source.plugins, overrides.plugins, resolvePlugin);
  const presets = mergeArray(source.presets, overrides.presets, resolvePreset);
  const sourceEnv = source.env || {};
  const overridesEnv = overrides.env || {};
  return Object.assign(
    presets.length ? { presets } : {},
    plugins.length ? { plugins } : {},
    merge.all([
      omit(source, ['plugins', 'presets', 'env']),
      omit(overrides, ['plugins', 'presets', 'env']),
      ...[...new Set([
        ...Object.keys(sourceEnv),
        ...Object.keys(overridesEnv)
      ])].map(name => ({
        env: {
          [name]: babelMerge(sourceEnv[name], overridesEnv[name])
        }
      }))
    ], { arrayMerge })
  );
}

Object.defineProperty(babelMerge, 'all', {
  value: (values = []) =>
    values.reduce((acc, value) => {
      if (value) {
        Object.assign(acc, babelMerge(acc, value));
      }
      return acc;
    }, {})
});

module.exports = babelMerge;
