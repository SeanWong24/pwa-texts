import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html}", "**/*.{ttf,woff,woff2}"],
      },
      manifest: {
        name: "PWA Notepad",
        short_name: "PWANotepad",
        start_url: "/",
        theme_color: "#000000",
        background_color: "#ffffff",
        shortcuts: [
          {
            name: "HTML/CSS/JS Playground",
            short_name: "Playground",
            url: "/playground",
          },
        ],
        icons: [
          {
            src: "./icon192.png",
            sizes: "144x144 192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "./icon512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
        file_handlers: [
          {
            action: "/",
            accept: {
              "text/*": [
                ".txt",
                ".abap",
                ".cls",
                ".azcli",
                ".bat",
                ".cmd",
                ".bicep",
                ".mligo",
                ".clj",
                ".cljs",
                ".cljc",
                ".edn",
                ".coffee",
                ".c",
                ".h",
                ".cpp",
                ".cc",
                ".cxx",
                ".hpp",
                ".hh",
                ".hxx",
                ".cs",
                ".csx",
                ".cake",
                ".css",
                ".cypher",
                ".cyp",
                ".dart",
                ".dockerfile",
                ".ecl",
                ".ex",
                ".exs",
                ".flow",
                ".fs",
                ".fsi",
                ".ml",
                ".mli",
                ".fsx",
                ".fsscript",
                ".ftl",
                ".ftlh",
                ".ftlx",
                ".go",
                ".graphql",
                ".gql",
                ".handlebars",
                ".hbs",
                ".tf",
                ".tfvars",
                ".hcl",
                ".html",
                ".htm",
                ".shtml",
                ".xhtml",
                ".mdoc",
                ".jsp",
                ".asp",
                ".aspx",
                ".jshtm",
                ".ini",
                ".properties",
                ".gitconfig",
                ".java",
                ".jav",
                ".js",
                ".es6",
                ".jsx",
                ".mjs",
                ".cjs",
                ".jl",
                ".kt",
                ".kts",
                ".less",
                ".lex",
                ".lua",
                ".liquid",
                ".html.liquid",
                ".m3",
                ".i3",
                ".mg",
                ".ig",
                ".md",
                ".markdown",
                ".mdown",
                ".mkdn",
                ".mkd",
                ".mdwn",
                ".mdtxt",
                ".mdtext",
                ".mdx",
                ".s",
                ".dax",
                ".msdax",
                ".m",
                ".pas",
                ".p",
                ".pp",
                ".ligo",
                ".pl",
                ".pm",
                ".php",
                ".php4",
                ".php5",
                ".phtml",
                ".ctp",
                ".pla",
                ".dats",
                ".sats",
                ".hats",
                ".pq",
                ".pqm",
                ".ps1",
                ".psm1",
                ".psd1",
                ".proto",
                ".jade",
                ".pug",
                ".py",
                ".rpy",
                ".pyw",
                ".cpy",
                ".gyp",
                ".gypi",
                ".qs",
                ".r",
                ".rhistory",
                ".rmd",
                ".rprofile",
                ".rt",
                ".cshtml",
                ".redis",
                ".rst",
                ".rb",
                ".rbx",
                ".rjs",
                ".gemspec",
                ".rs",
                ".rlib",
                ".sb",
                ".scala",
                ".sc",
                ".sbt",
                ".scm",
                ".ss",
                ".sch",
                ".rkt",
                ".scss",
                ".sh",
                ".bash",
                ".sol",
                ".aes",
                ".rq",
                ".sql",
                ".st",
                ".iecst",
                ".iecplc",
                ".lc3lib",
                ".TcPOU",
                ".TcDUT",
                ".TcGVL",
                ".TcIO",
                ".swift",
                ".sv",
                ".svh",
                ".v",
                ".vh",
                ".tcl",
                ".twig",
                ".ts",
                ".tsx",
                ".cts",
                ".mts",
                ".vb",
                ".wgsl",
                ".xml",
                ".xsd",
                ".dtd",
                ".ascx",
                ".csproj",
                ".config",
                ".props",
                ".targets",
                ".wxi",
                ".wxl",
                ".wxs",
                ".xaml",
                ".svg",
                ".svgz",
                ".opf",
                ".xslt",
                ".xsl",
                ".yaml",
                ".yml",
                ".json",
                ".bowerrc",
                ".jshintrc",
                ".jscsrc",
                ".eslintrc",
                ".babelrc",
                ".har",
              ],
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ["@hey-web-components/monaco-editor"],
  },
});
