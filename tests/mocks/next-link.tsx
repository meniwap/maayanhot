import type { AnchorHTMLAttributes, PropsWithChildren } from 'react';

type LinkProps = PropsWithChildren<
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string;
  }
>;

export default function NextLink({ children, href, ...rest }: LinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
