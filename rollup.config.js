import path from "path"
import livereload from "rollup-plugin-livereload"
import serve from "rollup-plugin-serve"
import { terser } from "rollup-plugin-terser"
import ts from "rollup-plugin-typescript2";
import commonjs from '@rollup/plugin-commonjs';
 
export default {
  input: "./src/index.ts", 
 
  output: {
    file: path.resolve(__dirname, "./dist/index.js"),
    sourcemap: false,
    format: "es",
    name:'index' 
  },
 
  plugins: [
    ts(),
    livereload(),
    commonjs()
    // terser(),
    // serve({
    //   open: true,
    //   port: 8080,
    //   openPage: "/public/index.html"
    // }),
    
  ]
}