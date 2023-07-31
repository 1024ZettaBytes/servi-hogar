import million from 'million/compiler';

/** @type {import('next').NextConfig} */
const withTM = require("next-transpile-modules")([
  "@babel/preset-react",
]);


module.exports = million.next(withTM({
  // your custom config goes here
  reactStrictMode: true,
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
}), { auto: true});
