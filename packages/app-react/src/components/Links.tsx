import cx from 'classnames';
import type { FC, ReactNode } from 'react';

type LinkProps = BaseProps & {
  id?: string;
  href: string;
  icon?: ReactNode;
  name: string;
  className?: string;
  itemClassName?: string;
  linkClassName?: string;
};

type LinksProps = BaseProps & {
  links: (LinkProps & {
    renderLink?: (props: LinkProps) => ReactNode;
  })[];
};

const Links: FC<LinksProps> = ({ className, links, ...props }) => (
  <ul className={cx('', className)} {...props}>
    {links.map((p) => {
      const { href, id, name, icon, itemClassName, linkClassName, renderLink } = p;
      return renderLink ? (
        renderLink(p)
      ) : (
        <li key={`${id}-${name}`} className={itemClassName}>
          <a href={href} className={cx('link', linkClassName)}>
            {icon}
            {name}
          </a>
        </li>
      );
    })}
  </ul>
);

export default Links;
