import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type MutableRefObject,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefAttributes,
} from 'react';

import {
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingList,
  FloatingPortal,
  offset as floatingOffset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useListItem,
  useListNavigation,
  useMergeRefs,
  useRole,
  useTypeahead,
  type Placement,
} from '@floating-ui/react';

import styles from './DropdownMenu.module.css';

interface DropdownMenuContextValue {
  open: boolean;
  activeIndex: number | null;
  setActiveIndex: (index: number | null) => void;
  close: () => void;

  refs: ReturnType<typeof useFloating>['refs'];
  context: ReturnType<typeof useFloating>['context'];
  floatingStyles: ReturnType<typeof useFloating>['floatingStyles'];
  elementsRef: MutableRefObject<Array<HTMLElement | null>>;
  labelsRef: MutableRefObject<Array<string | null>>;

  disabledIndices: number[];

  getReferenceProps: ReturnType<typeof useInteractions>['getReferenceProps'];
  getFloatingProps: ReturnType<typeof useInteractions>['getFloatingProps'];
  getItemProps: ReturnType<typeof useInteractions>['getItemProps'];

  registerDisabled: (index: number, disabled: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenuContext() {
  const context = useContext(DropdownMenuContext);

  if (!context) {
    throw new Error(
      'DropdownMenu components must be used within a DropdownMenu provider.',
    );
  }

  return context;
}

// Root

export interface DropdownMenuProps {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  placement?: Placement;
  offset?: number;
}

function DropdownMenuRoot({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-end',
  offset = 4,
}: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [disabledIndices, setDisabledIndices] = useState<number[]>([]);

  const elementsRef = useRef<Array<HTMLElement | null>>([]);
  const labelsRef = useRef<Array<string | null>>([]);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      if (nextOpen) {
        setActiveIndex(0);
      } else {
        setActiveIndex(null);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const close = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const registerDisabled = useCallback((index: number, disabled: boolean) => {
    setDisabledIndices((current) => {
      if (disabled) {
        return current.includes(index)
          ? current
          : [...current, index].sort((a, b) => a - b);
      }

      return current.filter((item) => item !== index);
    });
  }, []);

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
    role: 'menu',
  });

  const listNavigation = useListNavigation(context, {
    listRef: elementsRef,
    activeIndex,
    onNavigate: setActiveIndex,
    loop: true,
    virtual: false,
    focusItemOnOpen: true,
    disabledIndices,
  });

  const typeahead = useTypeahead(context, {
    listRef: labelsRef,
    activeIndex,
    onMatch: setActiveIndex,
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  useEffect(() => {
    setActiveIndex(open ? 0 : null);
  }, [open]);

  const value = useMemo<DropdownMenuContextValue>(
    () => ({
      open,
      activeIndex,
      setActiveIndex,
      close,
      refs,
      context,
      floatingStyles,
      elementsRef,
      labelsRef,
      disabledIndices,
      getReferenceProps,
      getFloatingProps,
      getItemProps,
      registerDisabled,
    }),
    [
      open,
      activeIndex,
      close,
      refs,
      context,
      floatingStyles,
      disabledIndices,
      getReferenceProps,
      getFloatingProps,
      getItemProps,
      registerDisabled,
    ],
  );

  return (
    <DropdownMenuContext.Provider value={value}>{children}</DropdownMenuContext.Provider>
  );
}

// Trigger

type TriggerElementProps = HTMLAttributes<HTMLElement> & RefAttributes<HTMLElement>;

export interface DropdownMenuTriggerProps {
  children: ReactElement<TriggerElementProps>;
}

function DropdownMenuTrigger({ children }: DropdownMenuTriggerProps) {
  const { open, refs, getReferenceProps } = useDropdownMenuContext();

  const childRef = (children.props as { ref?: Ref<HTMLElement> }).ref;

  const mergedRef = useMergeRefs([refs.setReference, childRef]);

  const triggerProps = getReferenceProps({
    ...(children.props ?? {}),
    'aria-haspopup': 'menu',
    'aria-expanded': open,
  });

  return cloneElement(children, {
    ...triggerProps,
    ref: mergedRef,
  });
}

// Content

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {}

function DropdownMenuContent({
  children,
  className = '',
  style,
  ...props
}: DropdownMenuContentProps) {
  const {
    open,
    context,
    refs,
    floatingStyles,
    elementsRef,
    labelsRef,
    getFloatingProps,
  } = useDropdownMenuContext();

  if (!open) {
    return null;
  }

  return (
    <FloatingPortal>
      <FloatingFocusManager context={context} modal={false}>
        <div
          {...getFloatingProps(props)}
          ref={refs.setFloating}
          style={{
            ...floatingStyles,
            ...style,
          }}
          className={`${styles.content} ${className}`}
        >
          <FloatingList elementsRef={elementsRef} labelsRef={labelsRef}>
            {children}
          </FloatingList>
        </div>
      </FloatingFocusManager>
    </FloatingPortal>
  );
}

// Item

export interface DropdownMenuItemProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onSelect'
> {
  onSelect?: () => void;
  destructive?: boolean;
  textValue?: string;
}

function DropdownMenuItem({
  children,
  onSelect,
  destructive = false,
  disabled = false,
  textValue,
  className = '',
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { activeIndex, setActiveIndex, close, getItemProps, registerDisabled } =
    useDropdownMenuContext();

  const label = textValue ?? (typeof children === 'string' ? children : null);

  const { ref, index } = useListItem({
    label,
  });

  useEffect(() => {
    if (index < 0) return;

    registerDisabled(index, disabled);

    return () => {
      registerDisabled(index, false);
    };
  }, [index, disabled, registerDisabled]);

  const itemRef = useMergeRefs([ref]);

  const itemProps = getItemProps({
    ...props,
    ref: itemRef,
    type: 'button',
    role: 'menuitem',
    tabIndex: activeIndex === index ? 0 : -1,
    disabled,
    'aria-disabled': disabled || undefined,
    onFocus: () => {
      setActiveIndex(index);
    },
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);

      if (event.defaultPrevented || disabled) {
        return;
      }

      onSelect?.();
      close();
    },
  });

  return (
    <button
      {...itemProps}
      className={[
        styles.item,
        destructive && styles.destructive,
        disabled && styles.disabled,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

// Group

export interface DropdownMenuGroupProps extends HTMLAttributes<HTMLDivElement> {}

function DropdownMenuGroup({
  children,
  className = '',
  ...props
}: DropdownMenuGroupProps) {
  return (
    <div {...props} role="group" className={`${styles.group} ${className}`}>
      {children}
    </div>
  );
}

// Label

export interface DropdownMenuLabelProps extends HTMLAttributes<HTMLDivElement> {}

function DropdownMenuLabel({
  children,
  className = '',
  ...props
}: DropdownMenuLabelProps) {
  return (
    <div {...props} className={`${styles.label} ${className}`}>
      {children}
    </div>
  );
}

// Separator

function DropdownMenuSeparator() {
  return (
    <div role="separator" aria-orientation="horizontal" className={styles.separator} />
  );
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Group: DropdownMenuGroup,
  Label: DropdownMenuLabel,
  Separator: DropdownMenuSeparator,
});
