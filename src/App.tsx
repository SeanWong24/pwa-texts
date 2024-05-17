import React, { useEffect, useRef } from "react";
import {
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
import { getTheme } from "./utils/theme";

import "./App.css";

function App() {
  const [showLineNumbers, setShowLineNumbers] = React.useState(true);
  const [showMinimap, setShowMinimap] = React.useState(true);
  const [supportedLanguages, setSupportedLanguages] =
    React.useState<monaco.languages.ILanguageExtensionPoint[]>();
  const [endOfLine, setEndOfLine] =
    React.useState<monaco.editor.EndOfLineSequence>(
      monaco.editor.EndOfLineSequence.LF
    );
  const [language, setLanguage] = React.useState("plaintext");
  const [cursorPosition, setCursorPosition] = React.useState<monaco.Position>();
  const [characterCount, setCharacterCount] = React.useState<number>();
  const [linesCount, setLinesCount] = React.useState<number>();

  const editorElement = useRef<HeyMonacoEditor>(null);

  useEffect(() => {
    editorElement.current?.editor?.getModel()?.setEOL(endOfLine);
  }, [endOfLine]);

  return (
    <FluentProvider
      theme={getTheme() === "dark" ? webDarkTheme : webLightTheme}
    >
      <div className="main-container">
        {renderTopBar()}
        {renderEditor()}
        {renderBottomar()}
      </div>
    </FluentProvider>
  );

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
              >
                New
              </MenuItem>
              <MenuItem
                icon={<DocumentArrowUpRegular />}
                secondaryContent="Ctrl + O"
              >
                Open
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<SaveRegular />} secondaryContent="Ctrl + S">
                Save
              </MenuItem>
              <MenuItem
                icon={<SaveEditRegular />}
                secondaryContent="Ctrl + Shift + S"
              >
                Save As
              </MenuItem>
              <MenuDivider />
              <MenuItem icon={<ArrowExitRegular />}>Exit</MenuItem>
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
        ondidChangeModelContent={() => {
          setLinesCount(
            editorElement.current?.editor?.getModel()?.getLineCount()
          );
          setCharacterCount(editorElement.current?.editor?.getValue().length);
        }}
        oneditorInitialized={({ detail: { monaco, editor } }) => {
          setSupportedLanguages(monaco?.languages.getLanguages());
          editor = editor as monaco.editor.IStandaloneCodeEditor | undefined; // TODO temp fix
          setCursorPosition(editor?.getPosition() ?? void 0);
          editor?.onDidChangeCursorPosition((event) => {
            setCursorPosition(event.position);
          });
          // TODO refactor this
          setLinesCount(editor?.getModel()?.getLineCount());
          setCharacterCount(editor?.getValue().length);
          editor?.getModel()?.setEOL(endOfLine);
        }}
      ></MonacoEditor>
    );
  }

  function renderBottomar() {
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
            <ToolbarButton aria-label="File">
              {monaco.editor.EndOfLineSequence[endOfLine]}
            </ToolbarButton>
          </MenuTrigger>
          <MenuPopover>
            <MenuList
              checkedValues={{
                endOfLine: [monaco.editor.EndOfLineSequence[endOfLine]],
              }}
              onCheckedValueChange={(_e, { name, checkedItems }) => {
                switch (name) {
                  case "endOfLine": {
                    const value =
                      monaco.editor.EndOfLineSequence[
                        (checkedItems?.[0] ??
                          "") as keyof typeof monaco.editor.EndOfLineSequence
                      ];

                    setEndOfLine(value ?? monaco.editor.EndOfLineSequence.LF);
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
