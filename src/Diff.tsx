import React from "react";
import * as monaco from "monaco-editor";
import { MonacoDiffEditor } from "@hey-web-components/monaco-editor/react";
import { getTheme } from "./utils/theme";
import {
  FluentProvider,
  Menu,
  MenuItem,
  MenuItemRadio,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Toolbar,
  ToolbarButton,
  webDarkTheme,
} from "@fluentui/react-components";
import { modifiedFluentLightTheme } from "./utils/modified-fluent-light-theme";
import { useLocation } from "react-router-dom";

import "./Diff.css";

function Playground() {
  const location = useLocation();
  const theme = getTheme();
  const [supportedLanguages, setSupportedLanguages] =
    React.useState<monaco.languages.ILanguageExtensionPoint[]>();
  const [language, setLanguage] = React.useState(
    location?.state?.language ?? "plaintext"
  );

  return (
    <FluentProvider
      theme={getTheme() === "dark" ? webDarkTheme : modifiedFluentLightTheme}
    >
      <div className="diff-container">
        <Toolbar>
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
          <ToolbarButton></ToolbarButton>
        </Toolbar>
        <div className="diff-container">
          <MonacoDiffEditor
            original={location.state?.original}
            originalLanguage={language}
            modifiedLanguage={language}
            options={{ theme: theme === "dark" ? "vs-dark" : "vs" }}
            oneditorInitialized={() => {
              setSupportedLanguages(monaco.languages.getLanguages());
            }}
          />
        </div>
      </div>
    </FluentProvider>
  );
}

export default Playground;
