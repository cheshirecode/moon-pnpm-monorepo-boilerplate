import './style.css';
import { mount } from './microfrontend';

const root = document.getElementById('app');

if (root) {
  mount(root);
}
