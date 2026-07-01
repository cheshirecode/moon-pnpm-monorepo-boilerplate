import { mount } from './microfrontend';

const target = document.getElementById('app');

if (target) {
  mount(target);
}
