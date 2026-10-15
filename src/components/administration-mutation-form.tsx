"use client";

import { useSyncExternalStore, type ComponentProps } from 'react';

const subscribe = () => () => {};
const browserReady = () => true;
const serverReady = () => false;
type Props = Pick<ComponentProps<'form'>, 'children' | 'className' | 'onSubmit' | 'aria-busy' | 'aria-labelledby' | 'id' | 'role'>;

// Mutations are owned by SDK handlers, with no HTML form endpoint. Keep the
// confirmed fields readable on the server without offering a native submission.
export default function AdministrationMutationForm({ children, className, onSubmit, ...aria }: Props) {
  const ready = useSyncExternalStore(subscribe, browserReady, serverReady);
  const classes = className?.split(/\s+/) ?? [];
  // These panels also use flex/grid forms: their layout belongs to the fieldset's controls.
  const isLayout = (value: string) => /(?:^|:)(?:space-[xy]-|flex(?:-|$)|grid(?:-|$)|gap-|items-|justify-)/.test(value);
  const spacing = classes.filter(isLayout).join(' ');
  const container = classes.filter(value => !isLayout(value)).join(' ');
  return ready
    ? <form method="post" className={className} onSubmit={onSubmit} data-administration-mutation {...aria}>{children}</form>
    : <div className={container} data-administration-mutation {...aria}><fieldset disabled className={`m-0 min-w-0 border-0 p-0 ${spacing}`}>{children}</fieldset><noscript><p>Activez JavaScript pour modifier et enregistrer ces informations.</p></noscript></div>;
}
