import styled from '@emotion/styled';
import cx from 'classnames';
import type { FC, ReactNode } from 'react';

import { cardHoverClassnames, cardPalette } from '@/styles/palette';

type CardProps = BaseProps & {
  type: keyof typeof cardPalette;
  hover?: boolean;
  shadow?: boolean;
  title?: string;
  message?: ReactNode;
  objects?: {
    key?: string;
    [key: string]: unknown;
  }[];
  flex?: boolean;
  status?: number;
};

const StyledArticle = styled.article``;

const Card: FC<CardProps> = ({
  className,
  type,
  hover,
  flex = true,
  shadow,
  title,
  message,
  children,
  objects,
  ...props
}) => (
  <StyledArticle
    className={cx(
      'w-full',
      flex && 'flex flex-col justify-center',
      shadow && 'shadow-lg shadow-tertiary',
      cardPalette[type],
      hover && `${cardHoverClassnames[type]}`,
      className
    )}
    {...props}
  >
    {title ? <h4 className="text-center">{title}</h4> : null}
    {children ? children : null}
    {message ? <code className="text-center">{message}</code> : null}
    {objects
      ? objects.map((x) => (
          <pre className="pre-wrap" key={x?.toString() ?? String(x)}>
            {JSON.stringify(x, null, 2)}
          </pre>
        ))
      : null}
  </StyledArticle>
);

export default Card;
