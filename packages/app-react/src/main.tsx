import { mount } from './microfrontend';

// manual
import './styles/reset.css';
import './styles/index.css';
// uno
import 'virtual:uno.css';

const root = document.getElementById('root');

if (root) {
  mount(root);
}
