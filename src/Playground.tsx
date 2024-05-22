import React, { useEffect, useRef } from "react";
import { MonacoEditor } from "@hey-web-components/monaco-editor/react";
import { getTheme } from "./utils/theme";

import "./Playground.css";
import { HeyMonacoEditor } from "@hey-web-components/monaco-editor";

function Playground() {
  const theme = getTheme();
  const [html, setHtml] = React.useState("");
  const [css, setCss] = React.useState("");
  const [js, setJs] = React.useState("");
  const iframeElemet = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const doc = iframeElemet.current?.contentDocument;
    if (!doc) {
      return;
    }
    doc.open();
    doc.write(`
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>${html}</body>
        <script>${js}</script>
      </html>
    `);
    doc.close();
  }, [html, css, js]);

  return (
    <div className="playground-container">
      <div className="panel coding-panel">
        <div className="card">
          <h1>HTML</h1>
          <MonacoEditor
            language="html"
            options={{ theme: theme === "dark" ? "vs-dark" : "vs" }}
            ondidChangeModelContent={({ currentTarget }) =>
              setHtml((currentTarget as HeyMonacoEditor | null)?.value ?? "")
            }
          />
        </div>
        <div className="card">
          <h1>CSS</h1>
          <MonacoEditor
            language="css"
            options={{ theme: theme === "dark" ? "vs-dark" : "vs" }}
            ondidChangeModelContent={({ currentTarget }) =>
              setCss((currentTarget as HeyMonacoEditor | null)?.value ?? "")
            }
          />
        </div>
        <div className="card">
          <h1>JavaScript</h1>
          <MonacoEditor
            language="javascript"
            options={{ theme: theme === "dark" ? "vs-dark" : "vs" }}
            ondidChangeModelContent={({ currentTarget }) =>
              setJs((currentTarget as HeyMonacoEditor | null)?.value ?? "")
            }
          />
        </div>
      </div>
      <div className="panel preview-panel">
        <iframe ref={iframeElemet} />
      </div>
    </div>
  );
}

export default Playground;
