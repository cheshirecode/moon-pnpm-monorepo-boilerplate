export const addTheme = (
  name = '',
  config = { class: true, data: true, media: true, localStorage: true }
) => {
  if (document?.documentElement instanceof HTMLElement && name) {
    if (config?.class) {
      document.documentElement.classList.add(name);
    }
    if (config?.data) {
      document.documentElement.setAttribute('data-theme', name);
    }
    if (config?.localStorage) {
      localStorage?.setItem('theme', name);
    }
    return true;
  }
  return false;
};

export const removeTheme = (
  name: string,
  config = { class: true, data: true, media: true, localStorage: true }
) => {
  if (config?.class && name) {
    document?.documentElement?.classList?.remove(name);
  }
  if (config?.data) {
    document?.documentElement?.setAttribute('data-theme', '');
  }
  if (config?.localStorage) {
    localStorage?.setItem('theme', '');
  }
};

export const getTheme = (config = { data: true, media: true, localStorage: true }) => {
  let theme;
  if (config?.localStorage) {
    theme = localStorage?.getItem('theme');
  }
  if (!theme && theme !== '') {
    const isDarkQuery =
      config?.media && window?.matchMedia('(prefers-color-scheme: dark)')?.matches;
    theme = isDarkQuery ? 'dark' : '';
    if (!theme && config?.data) {
      theme = document?.documentElement?.getAttribute('data-theme') || '';
    }
  }
  return theme;
};

export const applyTheme = (baseClasses = ['bg-primary', 'color-primary', 'transition-all-200']) =>
  document?.body?.classList?.add(...baseClasses);
