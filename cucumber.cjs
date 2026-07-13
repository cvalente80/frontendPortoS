module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    import: ['features/support/*.mjs', 'features/step-definitions/*.mjs'],
    format: ['progress-bar'],
    publishQuiet: true,
  },
};
