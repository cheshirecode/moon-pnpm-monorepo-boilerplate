export interface CopyToClipboardEvent {
  preventDefault?: () => void;
}

export interface CopyToClipboardOptions {
  document?: Document;
  hiddenTextAreaClassName?: string;
  logError?: (message: string, error: unknown) => void;
  navigator?: Navigator;
  preventDefault?: boolean;
}

export type CopyToClipboardHandler = (
  event?: CopyToClipboardEvent | null
) => Promise<boolean>;

const CLIPBOARD_PERMISSION = 'clipboard-write' as PermissionName;
const DEFAULT_TEXTAREA_CLASS =
  'h-1 w-1 top-1 left-1 p-0 m-0 border-0 bg-transparent outline-none fixed';

const getGlobalDocument = () =>
  typeof document === 'undefined' ? undefined : document;

const getGlobalNavigator = () =>
  typeof navigator === 'undefined' ? undefined : navigator;

const canTryClipboardApi = async (nav: Navigator) => {
  if (!nav.clipboard?.writeText) {
    return false;
  }

  if (!nav.permissions?.query) {
    return true;
  }

  try {
    const permission = await nav.permissions.query({
      name: CLIPBOARD_PERMISSION
    });

    return permission.state === 'granted' || permission.state === 'prompt';
  } catch {
    return true;
  }
};

const copyWithTextArea = (
  value: string,
  doc: Document,
  hiddenTextAreaClassName: string
) => {
  if (!doc.queryCommandSupported?.('copy')) {
    return false;
  }

  let textArea: HTMLTextAreaElement | undefined;

  try {
    textArea = doc.createElement('textarea');
    textArea.textContent = value;
    textArea.className = hiddenTextAreaClassName;
    doc.body.appendChild(textArea);
    textArea.select();

    return doc.execCommand('copy');
  } finally {
    if (textArea) {
      doc.body.removeChild(textArea);
    }
  }
};

export const copyToClipboard = async (
  value: string,
  options: CopyToClipboardOptions = {}
) => {
  const nav = options.navigator ?? getGlobalNavigator();
  const doc = options.document ?? getGlobalDocument();

  if (nav && (await canTryClipboardApi(nav))) {
    try {
      await nav.clipboard.writeText(value);

      return true;
    } catch (error) {
      options.logError?.('Clipboard API copy failed.', error);
    }
  }

  if (!doc) {
    return false;
  }

  try {
    return copyWithTextArea(
      value,
      doc,
      options.hiddenTextAreaClassName ?? DEFAULT_TEXTAREA_CLASS
    );
  } catch (error) {
    options.logError?.('Textarea clipboard copy failed.', error);

    return false;
  }
};

export const createCopyToClipboard = (
  value: string,
  options: CopyToClipboardOptions = {}
): CopyToClipboardHandler => {
  return async (event) => {
    if (options.preventDefault) {
      event?.preventDefault?.();
    }

    return copyToClipboard(value, options);
  };
};

export default createCopyToClipboard;
