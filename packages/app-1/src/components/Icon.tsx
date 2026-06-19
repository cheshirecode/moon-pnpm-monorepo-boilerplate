import type { ImgHTMLAttributes, ReactElement } from 'react';
import { memo, useEffect, useState } from 'react';

type IconProps = BaseProps &
  ImgHTMLAttributes<HTMLImageElement> & {
    name: string;
  };

const Null = () => null;
const Icon = (props: IconProps) => {
  const [output, setOutput] = useState<ReactElement>(<Null />);
  useEffect(() => {
    const { name, ...rest } = props;
    const fn = async () => {
      const src = await import(`../assets/icon-${name}.svg`);
      setOutput(<img src={src.default} alt={name} {...rest} />);
    };
    fn();
  }, [props]);
  return output;
};

export default memo(Icon);
