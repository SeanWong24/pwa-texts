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
        name: "Texts",
        short_name: "Texts",
        start_url: "/app",
        theme_color: "#000000",
        background_color: "#ffffff",
        shortcuts: [
          {
            name: "HTML/CSS/JS Playground",
            short_name: "Playground",
            url: "/playground",
            icons: [{
              src: "./icon192.png",
              sizes: "192x192",
              type: "image/png"
            }]
          },
        ],
        icons: [
          {
            src: "./icon512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: 'any'
          },
        ],
        file_handlers: [
          {
            action: "/app",
            accept: {
              "text/*": [
                ".js", ".py", ".java", ".html", ".css", ".cpp", ".c", ".ts", ".json",
                ".xml", ".yaml", ".md", ".txt", ".scss", ".sh", ".bash", ".ini",
                ".properties", ".gitconfig", ".eslintrc", ".babelrc", ".rst", ".docx",
                ".pdf", ".tex", ".npmrc", ".yarnrc", ".dockerfile", ".gitignore",
                ".less", ".sass", ".handlebars", ".hbs", ".pug", ".jade", ".cshtml",
                ".redis", ".rb", ".rs", ".scala", ".sql", ".swift", ".tsx", ".wgsl",
                ".xsd", ".dtd", ".config", ".svg", ".yaml", ".yml"
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
