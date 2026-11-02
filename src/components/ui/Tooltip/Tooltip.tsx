import { cloneElement, useState, type ReactElement, type ReactNode } from 'react';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react';

import { Text } from '../Text/Text';
import styles from './Tooltip.module.css';

export interface TooltipProps {
  content: ReactNode;
  children: ReactElement;
  placement?: Placement;
  disabled?: boolean;
}

export function Tooltip({
  content,
  children,
  placement = 'top',
  disabled = false,
}: TooltipProps) {
  const [open, setOpen] = useState(false);

  const isOpen = open && !disabled;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (nextOpen) => setOpen(nextOpen),
    placement,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const hover = useHover(context, {
    enabled: !disabled,
    move: false,
    delay: {
      open: 400,
      close: 0,
    },
  });

  const focus = useFocus(context, {
    enabled: !disabled,
  });

  const dismiss = useDismiss(context, {
    enabled: !disabled,
    escapeKey: true,
    outsidePress: false,
  });

  const role = useRole(context, {
    role: 'tooltip',
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    role,
  ]);

  if (disabled) {
    return children;
  }

  const trigger = cloneElement(
    children as ReactElement<Record<string, unknown>>,
    getReferenceProps(),
  );

  return (
    <>
      <span ref={refs.setReference} className={styles.trigger}>
        {trigger}
      </span>

      {isOpen && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            className={styles.tooltip}
            {...getFloatingProps()}
          >
            <Text as="span" size="xs" color="primary">
              {content}
            </Text>
          </div>
        </FloatingPortal>
      )}
    </>
  );
}
