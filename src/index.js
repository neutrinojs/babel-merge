const omit = require('object.omit');
const merge = require('deepmerge');
const isPlainObject = require('is-plain-object');
const { resolvePlugin, resolvePreset } = require('@babel/core');

const deepmergeDefaults = Object.freeze({
  arrayMerge: (source = [], overrides = []) => [...new Set([...source, ...overrides])],
  isMergeableObject: value => isPlainObject(value) || Array.isArray(value)
});

function mergeArray(source = [], overrides = [], resolve, deepmergeOpts) {
  if (!source.length) {
    return overrides;
  }

  if (!overrides.length) {
    return source;
  }

  return [...source, ...overrides].reduce((reduction, override) => {
    const overrideName = resolve(Array.isArray(override) ? override[0] : override);
    const overrideOptions = Array.isArray(override) ? override[1] : {};
    const base = reduction.find((base) => {
      const baseName = resolve(Array.isArray(base) ? base[0] : base);

      return baseName === overrideName || baseName.includes(overrideName);
    });

    if (!base) {
      reduction.push(Array.isArray(override) ? [overrideName, overrideOptions] : overrideName);
      return reduction;
    }

    const index = reduction.indexOf(base);
    const baseName = resolve(Array.isArray(base) ? base[0] : base);
    const baseOptions = Array.isArray(base) ? base[1] : {};
    const options = merge(baseOptions, overrideOptions, { ...deepmergeDefaults, ...deepmergeOpts });

    reduction[index] = Object.keys(options).length ? [baseName, options] : baseName;

    return reduction;
  }, []);
}

function babelMerge(source = {}, overrides = {}, deepmergeOpts) {
  const plugins = mergeArray(source.plugins, overrides.plugins, resolvePlugin, deepmergeOpts);
  const presets = mergeArray(source.presets, overrides.presets, resolvePreset, deepmergeOpts);

  return merge.all([
    omit(source, ['plugins', 'presets', 'env']),
    omit(overrides, ['plugins', 'presets', 'env']),
    plugins.length ? { plugins } : {},
    presets.length ? { presets } : {},
    ...[...new Set([
      ...Object.keys(source.env || {}),
      ...Object.keys(overrides.env || {})
    ])].map(name => ({
      env: {
        [name]: (() => {
          if (source.env && source.env[name] && (!overrides.env || !overrides.env[name])) {
            return source.env[name];
          }

          if (overrides.env && overrides.env[name] && (!source.env || !source.env[name])) {
            return overrides.env[name];
          }

          return babelMerge(source.env[name], overrides.env[name], deepmergeOpts);
        })()
      }
    }))
  ], { ...deepmergeDefaults, ...deepmergeOpts });
}

Object.defineProperty(babelMerge, 'all', {
  value: (values = [], deepmergeOpts) =>
    values.reduce((acc, value) => {
      if (value) {
        Object.assign(acc, babelMerge(acc, value, deepmergeOpts));
      }
      return acc;
    }, {})
});

module.exports = babelMerge;
