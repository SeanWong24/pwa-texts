import React, { useEffect, useRef } from "react";
import {
  AppsListRegular,
  ArrowEnterLeftRegular,
  ArrowExitRegular,
  ArrowRedoRegular,
  ArrowSwapRegular,
  ArrowUndoRegular,
  CameraRegular,
  CodeRegular,
  CopyRegular,
  DocumentAddRegular,
  DocumentArrowUpRegular,
  DualScreenVerticalScrollRegular,
  MoreHorizontalRegular,
  PanelRightRegular,
  PlayRegular,
  TextBulletListSquareRegular,
  TextNumberListLtrRegular,
  SaveEditRegular,
  SaveRegular,
  SearchRegular,
  ShareRegular,
} from "@fluentui/react-icons";
import {
  Toolbar,
  ToolbarButton,
  ToolbarDivider,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuItemCheckbox,
  MenuItemRadio,
  FluentProvider,
  webDarkTheme,
  useUncontrolledFocus,
  ToolbarGroup,
  makeStyles,
  ToolbarToggleButton,
} from "@fluentui/react-components";
import { MonacoEditor } from "@hey-web-components/monaco-editor/react";
import { HeyMonacoEditor } from "@hey-web-components/monaco-editor";
import * as monaco from "monaco-editor";
import mousetrap from "mousetrap";
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import { getTheme } from "./utils/theme";
import { base64ToText, textToBase64 } from "./utils/snapshot";
import { useNavigate, useSearchParams } from "react-router-dom";
import { modifiedFluentLightTheme } from "./utils/modified-fluent-light-theme";

import githubMarkdownStyleUrl from "github-markdown-css/github-markdown.css?url";
import codeHighlightingStyleUrl from "highlight.js/styles/github.css?url";
import "./App.css";

type AppProps = {
  snapshot?: boolean;
  embedded?: boolean;
};

type EmbedProps = {
  readonly?: boolean;
  lineNumbers?: boolean;
  minimap?: boolean;
  stickyScroll?: boolean;
};

type EOL = "LF" | "CRLF";

const marked = new Marked(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

const useToolbarFarGroupStyles = makeStyles({
  toolbar: {
    justifyContent: "space-between",
  },
});

const LANGUAGES_SUPPORTING_PREVIEW = ["html", "markdown"];

let fileHandle: FileSystemFileHandle | undefined = undefined;
let title: string | undefined;
let preventingMarkChangePendingNextTime = false;
let hasChangePending = false;
function updatePendingChangeStatus(value: boolean) {
  hasChangePending = value;
  if (preventingMarkChangePendingNextTime) {
    hasChangePending = false;
    preventingMarkChangePendingNextTime = false;
  }
  if (hasChangePending) {
    document.title = `${title ?? fileHandle?.name ?? "Untitled"} *`;
  } else {
    document.title = title ?? fileHandle?.name ?? "Untitled";
  }
}

function initialAppData() {
  if (!localStorage.getItem("lineNumbersEnabled")) {
    localStorage.setItem("lineNumbersEnabled", "true");
  }
  if (!localStorage.getItem("minimapEnabled")) {
    localStorage.setItem("minimapEnabled", "true");
  }
  if (!localStorage.getItem("stickyScrollEnabled")) {
    localStorage.setItem("stickyScrollEnabled", "true");
  }
  if (!localStorage.getItem("defualtEndOfLine")) {
    localStorage.setItem("defualtEndOfLine", "LF");
  }
}

initialAppData();

function App({ snapshot = false, embedded = false }: AppProps) {
  const [lineNumbersEnabled, setLineNumbersEnabled] = React.useState(
    localStorage.getItem("lineNumbersEnabled") === "true"
  );
  const [minimapEnabled, setMinimapEnabled] = React.useState(
    localStorage.getItem("minimapEnabled") === "true"
  );
  const [stickyScrollEnabled, setStickyScrollEnabled] = React.useState(
    localStorage.getItem("stickyScrollEnabled") === "true"
  );
  const [supportedLanguages, setSupportedLanguages] =
    React.useState<monaco.languages.ILanguageExtensionPoint[]>();
  const [defaultEndOfLine, setDefualtEndOfLine] = React.useState<EOL>(
    (localStorage.getItem("defualtEndOfLine") as EOL | null) ?? "LF"
  );
  const [endOfLine, setEndOfLine] = React.useState<EOL>(defaultEndOfLine);
  const [language, setLanguage] = React.useState("plaintext");
  const [readOnly, setReadOnly] = React.useState(false);
  const [cursorPosition, setCursorPosition] = React.useState<monaco.Position>();
  const [characterCount, setCharacterCount] = React.useState<number>();
  const [linesCount, setLinesCount] = React.useState<number>();
  const [previewEnabled, setPreviewEnabled] = React.useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uncontrolledFocus = useUncontrolledFocus();

  const editorElement = useRef<HeyMonacoEditor>(null);
  const previewElement = useRef<HTMLIFrameElement>(null);

  const toolbarFarGroupStyles = useToolbarFarGroupStyles();

  useEffect(() => {
    window.addEventListener("beforeunload", (event) => {
      if (hasChangePending) {
        event.preventDefault();
      }
    });

    addKeyboardShortcuts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!LANGUAGES_SUPPORTING_PREVIEW.includes(language)) {
      setPreviewEnabled(false);
    }
  }, [language]);

  useEffect(() => {
    updatePreview(editorElement.current?.value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewEnabled]);

  useEffect(() => {
    localStorage.setItem("lineNumbersEnabled", lineNumbersEnabled.toString());
  }, [lineNumbersEnabled]);

  useEffect(() => {
    localStorage.setItem("minimapEnabled", minimapEnabled.toString());
  }, [minimapEnabled]);

  useEffect(() => {
    localStorage.setItem("stickyScrollEnabled", stickyScrollEnabled.toString());
  }, [stickyScrollEnabled]);

  useEffect(() => {
    localStorage.setItem("defualtEndOfLine", defaultEndOfLine);
  }, [defaultEndOfLine]);

  useEffect(() => {
    editorElement.current?.editor
      ?.getModel()
      ?.setEOL(
        monaco.editor.EndOfLineSequence[
          endOfLine as keyof typeof monaco.editor.EndOfLineSequence
        ]
      );
  }, [endOfLine]);

  return embedded ? (
    <div className="app-container">{renderEditor()}</div>
  ) : (
    <FluentProvider
      theme={getTheme() === "dark" ? webDarkTheme : modifiedFluentLightTheme}
    >
      <div className="app-container">
        {renderTopBar()}
        <div className="content-container" {...uncontrolledFocus}>
          {renderEditor()}
          {renderPreview()}
        </div>
        {renderBottomBar()}
      </div>
    </FluentProvider>
  );

  function createNew() {
    notifyIfAnyPendingChanges(async () => {
      history.pushState(null, "", "/");
      fileHandle = void 0;
      updateEditorContent("");
      title = "Untitled";
      setLanguage("plaintext");
      updatePendingChangeStatus(true);
      setEndOfLine(defaultEndOfLine);
    });
  }

  function openFile(_fileHandle?: FileSystemFileHandle) {
    notifyIfAnyPendingChanges(async () => {
      fileHandle =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _fileHandle ?? (await (window as any).showOpenFilePicker())?.[0];
      if (!fileHandle) {
        return;
      }
      history.pushState(null, "", "/");
      const file = await fileHandle.getFile();
      const extension = file.name.split(".").slice(1).pop() ?? "";
      const content = await file.text();
      const languages = monaco.languages.getLanguages();
      const language =
        languages.find((lang) => lang.mimetypes?.includes(file.type))?.id ??
        languages.find((lang) => lang.extensions?.includes(`.${extension}`))
          ?.id ??
        "plaintext";
      setLanguage(language);
      preventingMarkChangePendingNextTime = true;
      updateEditorContent(content);
      preventingMarkChangePendingNextTime = true;
      updateEOLBasedOnContent(content);
      title = file.name;
    });
  }

  async function saveFile(saveAs = false) {
    if (!fileHandle || saveAs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fileHandle = await (window as any).showSaveFilePicker({
        types: [
          {
            description: "Text Files",
            accept: {
              "text/plain": [".txt"],
            },
          },
        ],
      });
    }
    const writable = await fileHandle?.createWritable();
    await writable?.write(editorElement.current?.value ?? "");
    await writable?.close();
    updatePendingChangeStatus(false);
  }

  function exit() {
    notifyIfAnyPendingChanges(() => {
      window.close();
    });
  }

  function updateEOLBasedOnContent(content?: string) {
    const endOfLine = content?.match(/\r\n/) ? "CRLF" : "LF";
    setEndOfLine(endOfLine);
  }

  function updateEditorContent(content: string) {
    if (!editorElement.current) {
      return;
    }
    editorElement.current.value = content;
  }

  async function notifyIfAnyPendingChanges(continueCallback?: () => void) {
    if (hasChangePending) {
      const confirmed = window.confirm(
        "You have unsaved changes. Are you sure you want to leave?"
      );
      if (!confirmed) {
        return;
      }
    }
    continueCallback?.();
  }

  function addKeyboardShortcuts() {
    function executeKeyboardAction(
      event: mousetrap.ExtendedKeyboardEvent,
      shortcutHandler: () => void
    ) {
      event.preventDefault();
      shortcutHandler();
    }

    mousetrap.bind(["ctrl+n", "command+n"], (event) =>
      executeKeyboardAction(event, () => createNew())
    );
    mousetrap.bind(["ctrl+o", "command+o"], (event) =>
      executeKeyboardAction(event, () => openFile())
    );
    mousetrap.bind(["ctrl+s", "command+s"], (event) =>
      executeKeyboardAction(event, function () {
        saveFile();
      })
    );
    mousetrap.bind(["ctrl+shift+s", "command+shift+s"], (event) =>
      executeKeyboardAction(event, () => saveFile(true))
    );

    mousetrap.prototype.stopCallback = () => false;
  }

  function generateSnapshotURL() {
    const content = editorElement.current?.editor?.getValue();
    if (!content) {
      return;
    }
    const base64 = textToBase64(content);
    const url = new URL(
      `/app/snapshot?language=${language}&value=${encodeURIComponent(base64)}`,
      location.origin
    );
    return url.href;
  }

  function generateEmbeddableURL({
    readonly,
    lineNumbers,
    minimap,
    stickyScroll,
  }: EmbedProps) {
    const content = editorElement.current?.editor?.getValue();
    if (!content) {
      return;
    }
    const base64 = textToBase64(content);
    const url = new URL(
      `/app/embed?language=${language}&value=${encodeURIComponent(base64)}${
        readonly ? "&readonly=1" : ""
      }${lineNumbers ? "&lineNumbers=1" : ""}${minimap ? "&minimap=1" : ""}${
        stickyScroll ? "&stickyScroll=1" : ""
      }`,
      location.origin
    );
    return url.href;
  }

  function updatePreview(content?: string) {
    if (previewEnabled) {
      if (language == "html") {
        const doc = previewElement.current?.contentDocument;
        if (!doc) {
          return;
        }
        doc.open();
        doc.write(content ?? "");
        doc.close();
      } else if (language === "markdown") {
        const doc = previewElement.current?.contentDocument;
        if (!doc) {
          return;
        }
        const docContent = /*html*/ `
        <html>
        <head>
        <link rel="stylesheet" href="${githubMarkdownStyleUrl}">
        <link rel="stylesheet" href="${codeHighlightingStyleUrl}">
        <style>
          .markdown-body {
            box-sizing: border-box;
            min-width: 200px;
            max-width: 980px;
            margin: 0 auto;
            padding: 45px;
          }

          @media (max-width: 767px) {
            .markdown-body {
              padding: 15px;
            }
          }
        </style>
        </head>
        <body class="markdown-body">${marked.parse(content ?? "", {})}</body>
        </html>
        `;
        doc.open();
        doc.write(docContent);
        doc.close();
      }
    }
  }

  function renderTopBar() {
    return (
      <Toolbar
        className={toolbarFarGroupStyles.toolbar}
        checkedValues={{
          view: [...(previewEnabled ? ["previewEnabled"] : [])],
        }}
        onCheckedValueChange={(_e, { name, checkedItems }) => {
          switch (name) {
            case "view":
              setPreviewEnabled(
                !!checkedItems?.find((item) => item === "previewEnabled")
              );
              break;
          }
        }}
      >
        <ToolbarGroup>
          <Menu>
            <MenuTrigger>
              <ToolbarButton>File</ToolbarButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<DocumentAddRegular />}
                  secondaryContent="Ctrl + N"
                  onClick={() => createNew()}
                >
                  New
                </MenuItem>
                <MenuItem
                  icon={<DocumentArrowUpRegular />}
                  secondaryContent="Ctrl + O"
                  onClick={async () => openFile()}
                >
                  Open
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<SaveRegular />}
                  secondaryContent="Ctrl + S"
                  onClick={() => saveFile()}
                >
                  Save
                </MenuItem>
                <MenuItem
                  icon={<SaveEditRegular />}
                  secondaryContent="Ctrl + Shift + S"
                  onClick={() => saveFile(true)}
                >
                  Save As
                </MenuItem>
                {history.length <= 1 ? (
                  <>
                    <MenuDivider />
                    <MenuItem
                      icon={<ArrowExitRegular />}
                      onClick={() => exit()}
                    >
                      Exit
                    </MenuItem>
                  </>
                ) : null}
              </MenuList>
            </MenuPopover>
          </Menu>
          <Menu>
            <MenuTrigger>
              <ToolbarButton>Edit</ToolbarButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem
                  icon={<ArrowUndoRegular />}
                  secondaryContent={"Ctrl + Z"}
                  onClick={() => {
                    editorElement.current?.editor?.trigger(null, "undo", null);
                  }}
                >
                  Undo
                </MenuItem>
                <MenuItem
                  icon={<ArrowRedoRegular />}
                  secondaryContent={"Ctrl + Y"}
                  onClick={() => {
                    editorElement.current?.editor?.trigger(null, "redo", null);
                  }}
                >
                  Redo
                </MenuItem>
                {/* TODO figure out how to make cut/copy/paste work properly */}
                <MenuDivider />
                <MenuItem
                  icon={<SearchRegular />}
                  secondaryContent={"Ctrl + F"}
                  onClick={() => {
                    editorElement.current?.editor?.trigger(
                      null,
                      "actions.find",
                      null
                    );
                  }}
                >
                  Find
                </MenuItem>
                <MenuItem
                  icon={<ArrowSwapRegular />}
                  secondaryContent={"Ctrl + H"}
                  onClick={() => {
                    editorElement.current?.editor?.trigger(
                      null,
                      "editor.action.startFindReplaceAction",
                      null
                    );
                  }}
                >
                  Replace
                </MenuItem>
                <MenuDivider />
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <MenuItem icon={<ArrowEnterLeftRegular />}>
                      Default End Of Line
                    </MenuItem>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList
                      checkedValues={{
                        defaultEndOfLine: [defaultEndOfLine],
                      }}
                    >
                      <MenuItemRadio
                        name="defaultEndOfLine"
                        value="LF"
                        onClick={() => {
                          setDefualtEndOfLine("LF");
                        }}
                      >
                        LF
                      </MenuItemRadio>
                      <MenuItemRadio
                        name="defaultEndOfLine"
                        value="CRLF"
                        onClick={() => {
                          setDefualtEndOfLine("CRLF");
                        }}
                      >
                        CRLF
                      </MenuItemRadio>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </MenuList>
            </MenuPopover>
          </Menu>
          <Menu>
            <MenuTrigger>
              <ToolbarButton>View</ToolbarButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList
                checkedValues={{
                  view: [
                    ...(lineNumbersEnabled ? ["lineNumbersEnabled"] : []),
                    ...(minimapEnabled ? ["minimapEnabled"] : []),
                    ...(stickyScrollEnabled ? ["stickyScrollEnabled"] : []),
                  ],
                }}
                onCheckedValueChange={(_e, { name, checkedItems }) => {
                  switch (name) {
                    case "view":
                      setLineNumbersEnabled(
                        !!checkedItems?.find(
                          (item) => item === "lineNumbersEnabled"
                        )
                      );
                      setMinimapEnabled(
                        !!checkedItems?.find(
                          (item) => item === "minimapEnabled"
                        )
                      );
                      setStickyScrollEnabled(
                        !!checkedItems?.find(
                          (item) => item === "stickyScrollEnabled"
                        )
                      );
                      break;
                  }
                }}
              >
                <MenuItem
                  icon={<AppsListRegular />}
                  secondaryContent="F1"
                  onClick={() => {
                    editorElement.current?.editor?.focus();
                    editorElement.current?.editor?.trigger(
                      null,
                      "editor.action.quickCommand",
                      null
                    );
                  }}
                >
                  Command Palette
                </MenuItem>
                <MenuDivider />
                <MenuItemCheckbox
                  icon={<TextNumberListLtrRegular />}
                  name="view"
                  value="lineNumbersEnabled"
                >
                  Enable Line Numbers
                </MenuItemCheckbox>
                <MenuItemCheckbox
                  icon={<TextBulletListSquareRegular />}
                  name="view"
                  value="minimapEnabled"
                >
                  Enable Minimap
                </MenuItemCheckbox>
                <MenuItemCheckbox
                  icon={<DualScreenVerticalScrollRegular />}
                  name="view"
                  value="stickyScrollEnabled"
                >
                  Enable Sticky Scroll
                </MenuItemCheckbox>
                <MenuDivider />
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <MenuItem icon={<MoreHorizontalRegular />}>
                      More Fun
                    </MenuItem>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem
                        onClick={() => {
                          navigate("/diff", {
                            state: {
                              original: editorElement.current?.value ?? "",
                              language: language,
                            },
                          });
                        }}
                      >
                        Quick Diff
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          navigate("/playground");
                        }}
                      >
                        HTML/CSS/JS Playground
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </MenuList>
            </MenuPopover>
          </Menu>
          <Menu>
            <MenuTrigger>
              <ToolbarButton>Share</ToolbarButton>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <MenuItem icon={<CameraRegular />}>Snapshot</MenuItem>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem
                        icon={<CopyRegular />}
                        onClick={() => {
                          const url = generateSnapshotURL();
                          if (!url) {
                            alert("Failed to generate snapshot");
                            return;
                          }
                          navigator.clipboard.writeText(url);
                          prompt(
                            "Copied to clipboard. You can also manually copy the snapshot URL from below.",
                            url
                          );
                        }}
                      >
                        Copy
                      </MenuItem>
                      <MenuItem
                        icon={<ShareRegular />}
                        disabled={!navigator.share}
                        onClick={() =>
                          navigator.share?.({
                            title: fileHandle?.name ?? "Texts",
                            text: `Texts snapshot.`,
                            url: generateSnapshotURL(),
                          })
                        }
                      >
                        System Share
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
                <MenuItem
                  icon={<CodeRegular />}
                  onClick={() => {
                    const readonly = confirm(
                      "Do you want to make it readonly?"
                    );
                    const lineNumbers = confirm(
                      "Do you want to show line numbers?"
                    );
                    const minimap = confirm("Do you want to enable minimap?");
                    const stickyScroll = confirm(
                      "Do you want to enable sticky scroll?"
                    );
                    const url = generateEmbeddableURL({
                      readonly,
                      lineNumbers,
                      minimap,
                      stickyScroll,
                    });
                    if (!url) {
                      alert("Failed to generate snapshot");
                      return;
                    }
                    navigator.clipboard.writeText(url);
                    prompt(
                      "Copied to clipboard. You can paste it in the src attribute of an iframe. You can also manually copy the embeddable URL from below.",
                      url
                    );
                  }}
                >
                  Copy Embeddable URL
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </ToolbarGroup>
        <ToolbarGroup>
          {LANGUAGES_SUPPORTING_PREVIEW.includes(language) ? (
            <ToolbarToggleButton
              icon={<PanelRightRegular />}
              title="Toggle preview panel"
              name="view"
              value="previewEnabled"
            ></ToolbarToggleButton>
          ) : null}
          {language === "javascript" ? (
            <ToolbarButton
              icon={<PlayRegular />}
              title="Run Code"
              onClick={() => {
                const newWindow = window.open();
                if (!newWindow) {
                  return;
                }
                const iframe = newWindow.document.createElement("iframe");
                iframe.setAttribute("sandbox", "allow-scripts");
                iframe.style.position = "absolute";
                iframe.style.inset = "0";
                iframe.height = "100%";
                iframe.width = "100%";
                iframe.style.border = "none";
                iframe.srcdoc = /* html */ `
                <style>
                :root {
                  font-family: Arial, Helvetica, sans-serif;
                }
                </style>
                <script defer>
                  console.log = (str) => {
                    setTimeout(() => {
                      const p = document.createElement("p");
                      p.innerHTML = str;
                      document.body.append(p);
                    })
                  }
                  console.warn = (str) => {
                    setTimeout(() => {
                      const p = document.createElement("p");
                      p.style.color = "yellow";
                      p.innerHTML = str;
                      document.body.append(p);
                    })
                  }
                  console.error = (str) => {
                    setTimeout(() => {
                      const p = document.createElement("p");
                      p.style.color = "red";
                      p.innerHTML = str;
                      document.body.append(p);
                    })
                  }
                </script>
                <script>
                ${editorElement.current?.value ?? ""}
                </script>
                `;
                newWindow.document.body.append(iframe);
              }}
            ></ToolbarButton>
          ) : null}
        </ToolbarGroup>
      </Toolbar>
    );
  }

  function renderEditor() {
    return (
      <MonacoEditor
        ref={editorElement}
        language={language}
        options={{
          theme: getTheme() === "dark" ? "vs-dark" : "vs",
          lineNumbers: lineNumbersEnabled ? "on" : "off",
          minimap: { enabled: minimapEnabled },
          stickyScroll: { enabled: stickyScrollEnabled },
          readOnly: readOnly,
        }}
        onDrop={async (event) => {
          event.preventDefault();
          for (const item of event.dataTransfer.items) {
            if (item.kind === "file") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const fileHandle = await (item as any).getAsFileSystemHandle();
              await openFile(fileHandle);
            }
          }
        }}
        ondidChangeModelContent={() => {
          updatePendingChangeStatus(true);
          setLinesCount(
            editorElement.current?.editor?.getModel()?.getLineCount()
          );

          const currentValue = editorElement.current?.value;
          setCharacterCount(currentValue?.length);
          updatePreview(currentValue);
        }}
        oneditorInitialized={({ detail: { editor } }) => {
          setSupportedLanguages(monaco.languages.getLanguages());
          setCursorPosition(editor?.getPosition() ?? void 0);
          editor?.onDidChangeCursorPosition((event) => {
            setCursorPosition(event.position);
          });
          // TODO refactor this
          setLinesCount(editor?.getModel()?.getLineCount());
          setCharacterCount(editor?.getValue().length);
          editor
            ?.getModel()
            ?.setEOL(
              monaco.editor.EndOfLineSequence[
                endOfLine as keyof typeof monaco.editor.EndOfLineSequence
              ]
            );

          if (snapshot || embedded) {
            const language = searchParams.get("language") ?? "plaintext";
            const value = base64ToText(searchParams.get("value") ?? "");
            setLanguage(language);
            preventingMarkChangePendingNextTime = true;
            updateEditorContent(value);
            updateEOLBasedOnContent(value);
            if (snapshot) {
              title = "Snapshot";
            }
            if (embedded) {
              setReadOnly(!!searchParams.get("readonly"));
              setLineNumbersEnabled(!!searchParams.get("lineNumbers"));
              setMinimapEnabled(!!searchParams.get("minimap"));
              setStickyScrollEnabled(!!searchParams.get("stickScroll"));
              title = "Embedded";
            }
          }

          setTimeout(()=> {
            if ("launchQueue" in window) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any)["launchQueue"].setConsumer((launchParams: any) => {
                if (launchParams.files?.length > 0) {
                  for (const fileHandle of launchParams.files) {
                    openFile(fileHandle);
                  }
                }
              });
            }
          });
        }}
      ></MonacoEditor>
    );
  }

  function renderPreview() {
    if (previewEnabled) {
      return <iframe ref={previewElement}></iframe>;
    }
  }

  function renderBottomBar() {
    return (
      <Toolbar className={toolbarFarGroupStyles.toolbar}>
        <ToolbarGroup style={{ display: "flex" }}>
          <span className="non-interactive">
            Ln {cursorPosition?.lineNumber ?? Number.NaN}, Col{" "}
            {cursorPosition?.column ?? Number.NaN}
          </span>
          <ToolbarDivider />
          <span className="non-interactive">
            {characterCount ?? Number.NaN} characters,{" "}
            {linesCount ?? Number.NaN} lines
          </span>
        </ToolbarGroup>
        <ToolbarGroup style={{ display: "flex" }}>
          <Menu>
            <MenuTrigger>
              <MenuItem>{endOfLine}</MenuItem>
            </MenuTrigger>
            <MenuPopover>
              <MenuList
                checkedValues={{
                  endOfLine: [endOfLine],
                }}
                onCheckedValueChange={(_e, { name, checkedItems }) => {
                  switch (name) {
                    case "endOfLine": {
                      const value = checkedItems?.[0] as EOL | undefined;
                      setEndOfLine(value ?? "LF");
                      break;
                    }
                  }
                }}
              >
                {Object.values(monaco.editor.DefaultEndOfLine)
                  .filter((value) => typeof value === "string")
                  .map((value) => (
                    <MenuItemRadio
                      name="endOfLine"
                      value={value as string}
                      key={value}
                    >
                      {value}
                    </MenuItemRadio>
                  ))}
              </MenuList>
            </MenuPopover>
          </Menu>
          <ToolbarDivider />
          <Menu>
            <MenuTrigger>
              <MenuItem>UTF-8</MenuItem>
            </MenuTrigger>
            <MenuPopover>
              <MenuList checkedValues={{ encoding: ["utf8"] }}>
                {/* <MenuItemRadio name="encoding" value="ansi">
                ANSI
              </MenuItemRadio> */}
                <MenuItemRadio name="encoding" value="utf8">
                  UTF-8
                </MenuItemRadio>
              </MenuList>
            </MenuPopover>
          </Menu>
          <ToolbarDivider />
          <Menu>
            <MenuTrigger>
              <MenuItem>
                {supportedLanguages?.find(({ id }) => id === language)
                  ?.aliases?.[0] ?? language}
              </MenuItem>
            </MenuTrigger>
            <MenuPopover>
              <MenuList
                style={{ maxHeight: "calc(100vh - 100px)" }}
                checkedValues={{ language: [language] }}
                onCheckedValueChange={(_e, { name, checkedItems }) => {
                  switch (name) {
                    case "language":
                      setLanguage(checkedItems?.[0]);
                      break;
                  }
                }}
              >
                {supportedLanguages?.map((lang) => (
                  <MenuItemRadio name="language" value={lang.id} key={lang.id}>
                    {lang.aliases?.[0] ?? lang.id}
                  </MenuItemRadio>
                ))}
              </MenuList>
            </MenuPopover>
          </Menu>
        </ToolbarGroup>
      </Toolbar>
    );
  }
}

export default App;
