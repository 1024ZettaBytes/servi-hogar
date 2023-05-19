/** @type {import('next').NextConfig} */
const withTM = require("next-transpile-modules")([
  "@babel/preset-react",
]);


module.exports = withTM({
  // your custom config goes here
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/servi-bucket/*',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '/servi-bucket-test/*',
      },
    ],
  },
});
