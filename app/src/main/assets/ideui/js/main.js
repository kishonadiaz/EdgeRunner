import Editor from './editor.js?v=7';
import initUI from './ui.js?v=7';

const editor = new Editor('editorcont');

initUI(editor.editdisp('javascript'));