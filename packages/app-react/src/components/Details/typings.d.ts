import type { ReactNode } from 'react';

export type DetailsData = Record<string, ReactNode | ReactNode[]>;

export type DetailsRenderContext<T extends DetailsData = DetailsData> = {
  k: keyof T & string;
  v: T[keyof T];
};

export type DetailsMetadata<T extends DetailsData = DetailsData> = Partial<
  Record<
    'label' | 'field',
    {
      fullLinePre?: boolean;
      className?: string;
      renderAsLabel?: string;
      render?: (v: unknown, keyValue: DetailsRenderContext<T>, props?: DetailsProps<T>) => ReactNode;
    }
  >
>;

export type DetailsProps<T extends DetailsData = DetailsData> = BaseProps & {
  data?: T;
  contentClassName?: string;
  labelClassName?: string;
  fieldClassName?: string;
  fieldCopy?: boolean;
  /**
   * metadata to customise look and feel, based on key
   * * to apply to all. resolution order - key > * > null
   */
  metadata?: Partial<Record<keyof T | '*', DetailsMetadata<T>>>;
  responsiveGrid?: boolean | string;
  containerQueryGrid?: boolean;
  oneFieldPerLine?: boolean;
  heading?: ReactNode;
  opened?: boolean;
  padding?: boolean;
  border?: boolean;
  borderPalette?: string;
  keyFormatter?: (k: keyof T & string) => ReactNode;
  valueFormatter?: (v: DetailsRenderContext<T>) => ReactNode | ReactNode[];
};
