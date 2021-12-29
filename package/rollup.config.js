import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import { terser } from "rollup-plugin-terser"
import scss from 'rollup-plugin-scss';
import babel from "rollup-plugin-babel";
import pkg from "./package.json";

export default [
  {
    input: "src/js/index.js",
    output: [
      {
        name: "blogpad",
        file: pkg.browser,
        format: "umd",
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      scss({
        output: 'dist/blogpad.min.css',
        outputStyle: "compressed"
      }),
      babel({
        exclude: ["node_modules/**"],
      }),
      terser(),
    ],
  },
  {
    input: "src/js/index.js",
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
    plugins: [
      scss({
        output: 'dist/blogpad.min.css',
        outputStyle: "compressed"
      }),
      babel({
        exclude: ["node_modules/**"],
      }),
      terser(),
    ],
  },
];
