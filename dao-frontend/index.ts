import {mount} from 'svelte';
import '../ui-kit/index.js';
import App from './components/App.svelte';

const app = mount(App, {target: document.getElementById("root")});

export default app;