import * as monaco from './monaco/monaco.bundle.js';

/* ------------------------------------------------------------------
   Replace `host` when the companion app exists. Everything else in
   this file already talks to it and nothing else touches the network.
------------------------------------------------------------------ */
const host = {
    connected: false,
    files: {
        'js/editor.js': '// editor.js\n',
        'js/main.js': '// main.js\n',
        'js/ui.js': '// ui.js\n',
        'css/main.css': '/* main.css */\n',
        'ide.html': '<!doctype html>\n'
    },
    read(path) {
        return Promise.resolve(this.files[path] !== undefined ? this.files[path] : '');
    },
    write(path, text) {
        this.files[path] = text;
        return Promise.resolve();
    },
    run(path) {
        return Promise.reject(new Error('No host connected. Use Terminal \u203a Connect to host.'));
    }
};

const EXT = {
    js: 'javascript', mjs: 'javascript', ts: 'typescript', json: 'json',
    css: 'css', scss: 'scss', html: 'html', md: 'markdown', py: 'python',
    rs: 'rust', go: 'go', kt: 'kotlin', java: 'java', sh: 'shell',
    yml: 'yaml', yaml: 'yaml', xml: 'xml', sql: 'sql', c: 'c', cpp: 'cpp'
};

const langOf = path => EXT[path.split('.').pop().toLowerCase()] || 'plaintext';
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.prototype.slice.call(document.querySelectorAll(sel));

export default function initUI(editor) {
    const tabstrip = $('#tabstrip');
    const out = $('#panelout');
    const open = new Map();          // path -> { model, viewState, dirty }
    let current = null;

    /* ---------------- panel output ---------------- */

    const log = (text, isError) => {
        out.textContent += (out.textContent ? '\n' : '') + text;
        out.style.color = isError ? 'var(--red)' : '';
        out.scrollTop = out.scrollHeight;
    };

    /* ---------------- tabs ---------------- */

    const renderTabs = () => {
        tabstrip.textContent = '';
        open.forEach((entry, path) => {
            const tab = document.createElement('button');
            tab.className = 'tab' + (path === current ? ' active' : '') + (entry.dirty ? ' dirty' : '');
            tab.dataset.path = path;
            tab.appendChild(document.createTextNode(path.split('/').pop()));
            const x = document.createElement('i');
            x.className = 'x';
            x.dataset.action = 'tab.close';
            tab.appendChild(x);
            tabstrip.appendChild(tab);
        });
        $$('.tree .file').forEach(li => {
            li.classList.toggle('active', li.dataset.path === current);
        });
    };

    const openFile = path => {
        if (open.has(path)) return activate(path);
        return host.read(path).then(text => {
            const model = monaco.editor.createModel(text, langOf(path), monaco.Uri.parse('file:///' + path));
            const entry = { model: model, viewState: null, dirty: false };
            model.onDidChangeContent(() => {
                if (!entry.dirty) {
                    entry.dirty = true;
                    renderTabs();
                }
            });
            open.set(path, entry);
            activate(path);
        });
    };

    const activate = path => {
        if (current && open.has(current)) {
            open.get(current).viewState = editor.saveViewState();
        }
        const entry = open.get(path);
        current = path;
        editor.setModel(entry.model);
        if (entry.viewState) editor.restoreViewState(entry.viewState);
        editor.focus();
        renderTabs();
        updateStatus();
    };

    const closeFile = path => {
        const entry = open.get(path);
        if (!entry) return;
        entry.model.dispose();
        open.delete(path);
        if (current === path) {
            current = null;
            const next = open.keys().next();
            if (next.done) editor.setModel(null);
            else activate(next.value);
        }
        renderTabs();
    };

    const saveFile = path => {
        const entry = open.get(path);
        if (!entry) return Promise.resolve();
        return host.write(path, entry.model.getValue()).then(() => {
            entry.dirty = false;
            renderTabs();
            log('Saved ' + path);
        });
    };

    /* ---------------- status bar ---------------- */

    const setStat = (action, text) => {
        const el = $('[data-action="' + action + '"]');
        if (el) el.lastChild.textContent = text;
    };

    const updateStatus = () => {
        const pos = editor.getPosition();
        if (pos) setStat('editor.position', 'Ln ' + pos.lineNumber + ', Col ' + pos.column);
        const model = editor.getModel();
        setStat('editor.language', model ? model.getLanguageId() : '\u2014');
    };

    editor.onDidChangeCursorPosition(updateStatus);

    monaco.editor.onDidChangeMarkers(() => {
        const markers = monaco.editor.getModelMarkers({});
        let errors = 0, warnings = 0;
        markers.forEach(m => {
            if (m.severity === monaco.MarkerSeverity.Error) errors += 1;
            else if (m.severity === monaco.MarkerSeverity.Warning) warnings += 1;
        });
        setStat('editor.problems', errors + ' errors, ' + warnings + ' warnings');
    });

    /* ---------------- actions ---------------- */

    const run = name => editor.trigger('ui', name, null);

    let untitled = 0;

    const actions = {
        'file.new': () => {
            untitled += 1;
            const path = 'untitled-' + untitled + '.js';
            host.files[path] = '';
            openFile(path);
        },
        'file.open': () => log('Open file needs a host connection.'),
        'folder.open': () => log('Open folder needs a host connection.'),
        'file.save': () => current && saveFile(current),
        'file.saveAs': () => log('Save as needs a host connection.'),
        'file.saveAll': () => open.forEach((e, p) => e.dirty && saveFile(p)),
        'file.close': () => current && closeFile(current),

        'edit.undo': () => run('undo'),
        'edit.redo': () => run('redo'),
        'edit.cut': () => run('editor.action.clipboardCutAction'),
        'edit.copy': () => run('editor.action.clipboardCopyAction'),
        'edit.paste': () => run('editor.action.clipboardPasteAction'),
        'edit.find': () => run('actions.find'),
        'edit.replace': () => run('editor.action.startFindReplaceAction'),
        'edit.format': () => run('editor.action.formatDocument'),
        'edit.comment': () => run('editor.action.commentLine'),

        'view.explorer': () => showSide('files'),
        'view.search': () => showSide('search'),
        'view.scm': () => showSide('scm'),
        'view.drawer': () => $('#drawer').classList.toggle('collapsed'),
        'view.panel': () => $('#panel').classList.toggle('collapsed'),
        'view.minimap': () => {
            minimap = !minimap;
            editor.updateOptions({ minimap: { enabled: minimap } });
        },
        'view.wrap': () => {
            wrap = !wrap;
            editor.updateOptions({ wordWrap: wrap ? 'on' : 'off' });
        },

        'run.start': () => {
            if (!current) return;
            log('$ run ' + current);
            host.run(current).catch(err => log(err.message, true));
        },
        'run.build': () => host.run('build').catch(err => log(err.message, true)),
        'run.stop': () => log('Nothing running.'),
        'debug.start': () => log('Debugging needs a host connection.'),
        'debug.step': () => log('Not running.'),
        'debug.stepIn': () => log('Not running.'),
        'debug.breakpoint': () => log('Breakpoints need a host connection.'),

        'term.new': () => { $('#panel').classList.remove('collapsed'); showPanel('terminal'); },
        'term.clear': () => { out.textContent = ''; out.style.color = ''; },
        'host.connect': () => log('No transport yet. Wire host.connect() to your companion app.'),
        'host.disconnect': () => setConnected(false),

        'tab.close': el => closeFile(el.closest('.tab').dataset.path),
        'editor.language': () => log('Language: ' + (editor.getModel() ? editor.getModel().getLanguageId() : 'none'))
    };

    let minimap = true;
    let wrap = false;

    const setConnected = state => {
        host.connected = state;
        const el = $('[data-action="host.connect"]');
        el.classList.toggle('online', state);
        el.lastChild.textContent = state ? 'Connected' : 'Offline';
    };

    /* ---------------- panel + side switching ---------------- */

    const showSide = name => {
        $$('.side-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
        $$('.side-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === name));
        $('#drawer').classList.remove('collapsed');
    };

    const showPanel = name => {
        $$('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === name));
    };

    /* ---------------- one delegated listener ---------------- */

    document.addEventListener('click', event => {
        const sideTab = event.target.closest('.side-tab');
        if (sideTab) return showSide(sideTab.dataset.panel);

        const panelTab = event.target.closest('.panel-tab');
        if (panelTab) return showPanel(panelTab.dataset.panel);

        const actionEl = event.target.closest('[data-action]');
        if (actionEl && actions[actionEl.dataset.action]) {
            event.preventDefault();
            return actions[actionEl.dataset.action](actionEl);
        }

        const tab = event.target.closest('.tab');
        if (tab) return activate(tab.dataset.path);

        const row = event.target.closest('.tree .row');
        if (row) {
            const li = row.parentNode;
            if (li.classList.contains('folder')) li.classList.toggle('open');
            else openFile(li.dataset.path);
        }
    });

    /* ---------------- keyboard ---------------- */

    document.addEventListener('keydown', event => {
        if (!event.ctrlKey && !event.metaKey) {
            if (event.key === 'F5') { event.preventDefault(); actions['run.start'](); }
            return;
        }
        const key = event.key.toLowerCase();
        const map = { s: 'file.save', n: 'file.new', w: 'file.close', b: 'view.drawer', j: 'view.panel' };
        if (map[key]) {
            event.preventDefault();
            actions[map[key]]();
        }
    });

    /* ---------------- boot ---------------- */

    setConnected(false);
    openFile('js/editor.js');
}
