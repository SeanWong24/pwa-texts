import React, { useEffect, useRef } from "react";
import {
  ArrowEnterLeftRegular,
  ArrowExitRegular,
  ArrowRedoRegular,
  ArrowSwapRegular,
  ArrowUndoRegular,
  CameraRegular,
  ClipboardPasteRegular,
  CodeRegular,
  CopyRegular,
  CutRegular,
  DocumentAddRegular,
  DocumentArrowUpRegular,
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
  webLightTheme,
} from "@fluentui/react-components";
import { MonacoEditor } from "@hey-web-components/monaco-editor/react";
import { HeyMonacoEditor } from "@hey-web-components/monaco-editor";
import * as monaco from "monaco-editor";
import mousetrap from "mousetrap";
import { getTheme } from "./utils/theme";

import "./App.css";

type EOL = "LF" | "CRLF";

let fileHandle: FileSystemFileHandle | undefined = undefined;
let hasChangePending = false;
function updatePendingChangeStatus(value: boolean) {
  hasChangePending = value;
  if (value) {
    document.title = `${fileHandle?.name ?? "Untitled"} *`;
  } else {
    document.title = fileHandle?.name ?? "Untitled";
  }
}

function App() {
  const [showLineNumbers, setShowLineNumbers] = React.useState(true);
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [supportedLanguages, setSupportedLanguages] =
    React.useState<monaco.languages.ILanguageExtensionPoint[]>();
  const [defaultEndOfLine, setDefualtEndOfLine] = React.useState<EOL>(
    (localStorage.getItem("defualtEndOfLine") as EOL | null) ?? "LF"
  );
  const [endOfLine, setEndOfLine] = React.useState<EOL>(defaultEndOfLine);
  const [language, setLanguage] = React.useState("plaintext");
  const [cursorPosition, setCursorPosition] = React.useState<monaco.Position>();
  const [characterCount, setCharacterCount] = React.useState<number>();
  const [linesCount, setLinesCount] = React.useState<number>();

  const editorElement = useRef<HeyMonacoEditor>(null);

  useEffect(() => {
    window.addEventListener("beforeunload", (event) => {
      if (hasChangePending) {
        event.preventDefault();
      }
    });

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

    addKeyboardShortcuts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <FluentProvider
      theme={getTheme() === "dark" ? webDarkTheme : webLightTheme}
    >
      <div className="main-container">
        {renderTopBar()}
        {renderEditor()}
        {renderBottomBar()}
      </div>
    </FluentProvider>
  );

  function createNew() {
    notifyIfAnyPendingChanges(async () => {
      fileHandle = void 0;
      updateEditorContent("");
      updatePendingChangeStatus(true);
      setEndOfLine(defaultEndOfLine);
    });
  }

  async function openFile(_fileHandle?: FileSystemFileHandle) {
    notifyIfAnyPendingChanges(async () => {
      fileHandle =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        _fileHandle ?? (await (window as any).showOpenFilePicker())?.[0];
      if (!fileHandle) {
        return;
      }
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
      updateEditorContent(content);
      const endOfLine = content.match(/\r\n/) ? "CRLF" : "LF";
      setEndOfLine(endOfLine);
      setTimeout(() => {
        updatePendingChangeStatus(false);
      });
      document.title = file.name;
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

  function updateEditorContent(content: string) {
    if (!editorElement.current) {
      return;
    }
    editorElement.current.value = content;
  }

  async function notifyIfAnyPendingChanges(continueCallback?: () => void) {
    if (hasChangePending) {
      const confirmed = await window.confirm(
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

  function renderTopBar() {
    return (
      <Toolbar aria-label="Default">
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
                onClick={async () => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const fileHandle = await (window as any).showOpenFilePicker();
                  openFile(fileHandle[0]);
                }}
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
              <MenuDivider />
              <MenuItem icon={<ArrowExitRegular />} onClick={() => exit()}>
                Exit
              </MenuItem>
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
              >
                Undo
              </MenuItem>
              <MenuItem
                icon={<ArrowRedoRegular />}
                secondaryContent={"Ctrl + Y"}
                disabled
              >
                Redo
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<CutRegular />} secondaryContent={"Ctrl + X"}>
                Cut
              </MenuItem>
              <MenuItem icon={<CopyRegular />} secondaryContent={"Ctrl + C"}>
                Copy
              </MenuItem>
              <MenuItem
                icon={<ClipboardPasteRegular />}
                secondaryContent={"Ctrl + V"}
              >
                Paste
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<SearchRegular />} secondaryContent={"Ctrl + F"}>
                Find
              </MenuItem>
              <MenuItem
                icon={<ArrowSwapRegular />}
                secondaryContent={"Ctrl + H"}
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
                  ...(showLineNumbers ? ["showLineNumbers"] : []),
                  ...(showMinimap ? ["showMinimap"] : []),
                ],
              }}
              onCheckedValueChange={(_e, { name, checkedItems }) => {
                switch (name) {
                  case "view":
                    setShowLineNumbers(
                      !!checkedItems?.find((item) => item === "showLineNumbers")
                    );
                    setShowMinimap(
                      !!checkedItems?.find((item) => item === "showMinimap")
                    );
                    break;
                }
              }}
            >
              <MenuItemCheckbox
                icon={<TextNumberListLtrRegular />}
                name="view"
                value="showLineNumbers"
              >
                Show Line Numbers
              </MenuItemCheckbox>
              <MenuItemCheckbox
                icon={<TextBulletListSquareRegular />}
                name="view"
                value="showMinimap"
              >
                Show Minimap
              </MenuItemCheckbox>
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
                    <MenuItem icon={<CopyRegular />}>Copy</MenuItem>
                    <MenuItem icon={<ShareRegular />} disabled>
                      System Share
                    </MenuItem>
                  </MenuList>
                </MenuPopover>
              </Menu>
              <MenuItem icon={<CodeRegular />}>Embed</MenuItem>
            </MenuList>
          </MenuPopover>
        </Menu>
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
          lineNumbers: showLineNumbers ? "on" : "off",
          minimap: { enabled: showMinimap },
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
          setCharacterCount(editorElement.current?.editor?.getValue().length);
        }}
        oneditorInitialized={({ detail: { editor } }) => {
          setSupportedLanguages(monaco.languages.getLanguages());
          editor = editor as monaco.editor.IStandaloneCodeEditor | undefined; // TODO temp fix
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
        }}
      ></MonacoEditor>
    );
  }

  function renderBottomBar() {
    return (
      <Toolbar>
        <span>
          Ln {cursorPosition?.lineNumber ?? Number.NaN}, Col{" "}
          {cursorPosition?.column ?? Number.NaN}
        </span>
        <ToolbarDivider />
        <span>
          {characterCount ?? Number.NaN} characters, {linesCount ?? Number.NaN}{" "}
          lines
        </span>
        <ToolbarDivider />
        <Menu>
          <MenuTrigger>
            <ToolbarButton aria-label="File">{endOfLine}</ToolbarButton>
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
            <ToolbarButton aria-label="File">UTF-8</ToolbarButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList checkedValues={{ encoding: ["utf8"] }}>
              <MenuItemRadio name="encoding" value="ansi">
                ANSI
              </MenuItemRadio>
              <MenuItemRadio name="encoding" value="utf8">
                UTF-8
              </MenuItemRadio>
            </MenuList>
          </MenuPopover>
        </Menu>
        <ToolbarDivider />
        <Menu>
          <MenuTrigger>
            <ToolbarButton aria-label="File">
              {supportedLanguages?.find(({ id }) => id === language)
                ?.aliases?.[0] ?? language}
            </ToolbarButton>
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
      </Toolbar>
    );
  }
}

export default App;
