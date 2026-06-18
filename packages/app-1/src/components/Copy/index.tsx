import cx from 'classnames';
import stringify from 'fast-json-stable-stringify';
import { isString } from 'lodash-es';

import createOnClickCopyToClipboard from '@fieryeagle/browser-clipboard';

const Copy = ({ data, className, children, ...rest }: BaseProps & { data: unknown }) => (
  <button
    className={cx('btn self-center cursor-pointer flex justify-center items-center', className)}
    onClick={createOnClickCopyToClipboard(isString(data) ? data : stringify(data))}
    {...rest}
  >
    {children ? children : null}
  </button>
);

export default Copy;
