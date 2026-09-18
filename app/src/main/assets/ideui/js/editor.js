import * as monaco from './monaco/monaco.bundle.js?v=1';

// Resolved against the page, so no import.meta (that is ES2020, not ES6).
const MONACO_BASE = new URL('js/monaco/', document.baseURI);
const LIBS_BASE = new URL('js/libs/', document.baseURI);

self.MonacoEnvironment = {
    getWorker(moduleId, label) {
        let file = 'editor.worker.js';
        if (label === 'json') {
            file = 'json.worker.js';
        } else if (label === 'css' || label === 'scss' || label === 'less') {
            file = 'css.worker.js';
        } else if (label === 'html' || label === 'handlebars' || label === 'razor') {
            file = 'html.worker.js';
        } else if (label === 'typescript' || label === 'javascript') {
            file = 'ts.worker.js';
        }
        return new Worker(new URL(file, MONACO_BASE));
    }
};

class Editor {
    constructor(container) {
        this.cont = container;
        this.instance = null;
    }

    configureLanguages() {
        const ts = monaco.languages.typescript;
        const targets = [ts.javascriptDefaults, ts.typescriptDefaults];

        targets.forEach(defaults => {
            // setCompilerOptions REPLACES. Dropping allowJs kills IntelliSense.
            defaults.setCompilerOptions(Object.assign({}, defaults.getCompilerOptions(), {
                target: ts.ScriptTarget.ES2015,
                lib: ['es2015', 'dom', 'dom.iterable'],
                allowJs: true,
                checkJs: true,
                allowNonTsExtensions: true,
                moduleResolution: ts.ModuleResolutionKind.NodeJs,
                noEmit: true
            }));

            defaults.setEagerModelSync(true);

            defaults.setDiagnosticsOptions({
                noSemanticValidation: false,
                noSyntaxValidation: false,
                noSuggestionDiagnostics: false
            });

            defaults.setInlayHintsOptions({
                includeInlayParameterNameHints: 'all',
                includeInlayFunctionParameterTypeHints: true,
                includeInlayVariableTypeHints: true,
                includeInlayPropertyDeclarationTypeHints: true,
                includeInlayFunctionLikeReturnTypeHints: true
            });
        });
    }

    // path is the virtual filename and the identity key.
    // Re-registering the same path replaces that lib.
    addLib(source, path) {
        const ts = monaco.languages.typescript;
        ts.javascriptDefaults.addExtraLib(source, path);
        ts.typescriptDefaults.addExtraLib(source, path);
        return path;
    }

    loadLibs() {
        return fetch(new URL('manifest.json', LIBS_BASE))
            .then(response => response.json())
            .then(manifest => Promise.all(manifest.libs.map(lib =>
                fetch(new URL(lib.file, LIBS_BASE))
                    .then(response => response.text())
                    .then(source => this.addLib(source, lib.path))
            )))
            .catch(error => {
                console.warn('lib load failed:', error);
                return [];
            });
    }

    editdisp(language = 'javascript') {
        this.configureLanguages();

        this.instance = monaco.editor.create(document.getElementById(this.cont), {
            value: 'const greet = () => {\n  console.log("Hello ES6");\n};\n',
            language: language,
            theme: 'vs-dark',
            automaticLayout: true,
            fontSize: 14,
            lineHeight: 1.6,

            quickSuggestions: { other: true, comments: false, strings: true },
            quickSuggestionsDelay: 10,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: 'off',
            parameterHints: { enabled: true, cycle: true },
            inlayHints: { enabled: 'on' },
            suggestSelection: 'recentlyUsedByPrefix',
            snippetSuggestions: 'inline',
            formatOnPaste: true,
            bracketPairColorization: { enabled: true },
            suggest: {
                showWords: false,
                showStatusBar: true,
                preview: true,
                insertMode: 'replace'
            }
        });

        this.loadLibs();

        return this.instance;
    }

    setLanguage(lang) {
        monaco.editor.setModelLanguage(this.instance.getModel(), lang);
    }
}

export default Editor;