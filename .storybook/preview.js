"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
require("../src/styles/themes.css");
require("../src/styles/global.css");
function ThemeWrapper(_a) {
    var theme = _a.theme, children = _a.children;
    (0, react_1.useLayoutEffect)(function () {
        var root = document.documentElement;
        var mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
        var applyTheme = function () {
            var resolvedTheme = theme === 'system'
                ? mediaQuery.matches
                    ? 'light'
                    : 'dark'
                : theme;
            root.dataset.theme = resolvedTheme;
        };
        applyTheme();
        if (theme === 'system') {
            mediaQuery.addEventListener('change', applyTheme);
            return function () {
                mediaQuery.removeEventListener('change', applyTheme);
            };
        }
    }, [theme]);
    return children;
}
var preview = {
    globalTypes: {
        theme: {
            description: 'Application theme',
            toolbar: {
                title: 'Theme',
                icon: 'paintbrush',
                items: [
                    { value: 'dark', title: 'Dark' },
                    { value: 'light', title: 'Light' },
                    { value: 'system', title: 'System' },
                ],
                dynamicTitle: true,
            },
        },
    },
    initialGlobals: {
        theme: 'dark',
    },
    decorators: [
        function (Story, context) { return (<ThemeWrapper theme={context.globals.theme}>
        <Story />
      </ThemeWrapper>); },
    ],
    parameters: {
        controls: {
            expanded: true,
        },
        actions: {
            argTypesRegex: '^on[A-Z].*',
        },
        layout: 'centered',
    },
};
exports.default = preview;
