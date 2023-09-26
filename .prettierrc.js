module.exports = {
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  printWidth: 200,
  overrides: [
    {
      files: "*.json",
      options: {
        printWidth: 200,
      },
    },
  ],
};
