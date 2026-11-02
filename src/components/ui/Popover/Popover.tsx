import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingPortal,
  offset as floatingOffset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useMergeRefs,
  useRole,
  type Placement,
} from '@floating-ui/react';

import styles from './Popover.module.css';

interface PopoverContextValue {
  open: boolean;
  contentId: string;
  context: ReturnType<typeof useFloating>['context'];
  refs: ReturnType<typeof useFloating>['refs'];
  floatingStyles: CSSProperties;
  getReferenceProps: ReturnType<typeof useInteractions>['getReferenceProps'];
  getFloatingProps: ReturnType<typeof useInteractions>['getFloatingProps'];
  close: () => void;
}

const PopoverContext = createContext<PopoverContextValue | null>(null);

function usePopoverContext() {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error('Popover components must be used within a Popover provider.');
  }

  return context;
}

export interface PopoverProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  offset?: number;
}

function PopoverRoot({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom',
  offset = 8,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const contentId = useId();

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: handleOpenChange,
    placement,
    middleware: [floatingOffset(offset), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  const click = useClick(context);

  const dismiss = useDismiss(context, {
    escapeKey: true,
    outsidePress: true,
  });

  const role = useRole(context, {
    role: 'dialog',
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  const close = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const value = useMemo<PopoverContextValue>(
    () => ({
      open,
      contentId,
      context,
      refs,
      floatingStyles,
      getReferenceProps,
      getFloatingProps,
      close,
    }),
    [
      open,
      contentId,
      context,
      refs,
      floatingStyles,
      getReferenceProps,
      getFloatingProps,
      close,
    ],
  );

  return <PopoverContext.Provider value={value}>{children}</PopoverContext.Provider>;
}

export interface PopoverTriggerProps {
  children: ReactElement;
}

function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { open, contentId, refs, getReferenceProps } = usePopoverContext();

  const childRef = (children.props as { ref?: Ref<HTMLElement> }).ref;

  const mergedRef = useMergeRefs([refs.setReference, childRef]);

  const props = getReferenceProps({
    ...(children.props ?? {}),
    ref: mergedRef,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': open ? contentId : undefined,
  });

  return cloneElement(children, props);
}

export interface PopoverContentProps extends HTMLAttributes<HTMLDivElement> {}

function PopoverContent({
  children,
  className = '',
  style,
  ...props
}: PopoverContentProps) {
  const { open, contentId, context, refs, floatingStyles, getFloatingProps } =
    usePopoverContext();

  if (!open) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal={false}>
        <div
          {...getFloatingProps(props)}
          id={contentId}
          ref={refs.setFloating}
          style={{
            ...floatingStyles,
            ...style,
          }}
          className={`${styles.content} ${className}`}
        >
          {children}
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

export interface PopoverCloseProps extends ButtonHTMLAttributes<HTMLButtonElement> {}

function PopoverClose({
  children = 'Close',
  className = '',
  onClick,
  type = 'button',
  ...props
}: PopoverCloseProps) {
  const { close } = usePopoverContext();

  return (
    <button
      {...props}
      type={type}
      className={className}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          close();
        }
      }}
    >
      {children}
    </button>
  );
}

export const Popover = Object.assign(PopoverRoot, {
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Close: PopoverClose,
});
