import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import styles from './Tabs.module.css';

export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsVariant = 'default' | 'pills';
export type TabsActivationMode = 'automatic' | 'manual';

interface TabsContextValue {
  value: string | undefined;
  setValue: (value: string) => void;
  orientation: TabsOrientation;
  variant: TabsVariant;
  activationMode: TabsActivationMode;
  baseId: string;
  listRef: React.RefObject<HTMLDivElement | null>;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);

  if (!context) {
    throw new Error('Tabs components must be used within Tabs.');
  }

  return context;
}

function getTabId(baseId: string, value: string) {
  return `${baseId}-tab-${encodeURIComponent(value)}`;
}

function getPanelId(baseId: string, value: string) {
  return `${baseId}-panel-${encodeURIComponent(value)}`;
}

// Root

export interface TabsProps {
  children: ReactNode;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: TabsOrientation;
  variant?: TabsVariant;
  activationMode?: TabsActivationMode;
}

function TabsRoot({
  children,
  value: controlledValue,
  defaultValue,
  onValueChange,
  orientation = 'horizontal',
  variant = 'default',
  activationMode = 'automatic',
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const setValue = useCallback(
    (nextValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(nextValue);
      }

      onValueChange?.(nextValue);
    },
    [isControlled, onValueChange],
  );

  const contextValue = useMemo<TabsContextValue>(
    () => ({
      value,
      setValue,
      orientation,
      variant,
      activationMode,
      baseId,
      listRef,
    }),
    [value, setValue, orientation, variant, activationMode, baseId],
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={[styles.root, styles[orientation], styles[variant]].join(' ')}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// List

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {}

function TabsList({ children, className = '', ...props }: TabsListProps) {
  const { orientation, listRef } = useTabsContext();

  return (
    <div
      {...props}
      ref={listRef}
      role="tablist"
      aria-orientation={orientation}
      className={`${styles.list} ${className}`}
    >
      {children}
    </div>
  );
}

// Trigger

export interface TabsTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> {
  value: string;
}

function TabsTrigger({
  value,
  children,
  disabled = false,
  className = '',
  onClick,
  onKeyDown,
  ...props
}: TabsTriggerProps) {
  const {
    value: selectedValue,
    setValue,
    orientation,
    activationMode,
    baseId,
    listRef,
  } = useTabsContext();

  const selected = selectedValue === value;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const isHorizontal = orientation === 'horizontal';

    const previousKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    if (
      event.key !== previousKey &&
      event.key !== nextKey &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return;
    }

    event.preventDefault();

    const list = listRef.current;

    if (!list) {
      return;
    }

    const tabs = Array.from(
      list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'),
    );

    if (tabs.length === 0) {
      return;
    }

    const currentIndex = tabs.indexOf(event.currentTarget);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number;

    if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    } else if (event.key === nextKey) {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    const nextTab = tabs[nextIndex];

    nextTab?.focus();

    if (activationMode === 'automatic') {
      const nextValue = nextTab?.dataset.value;

      if (nextValue !== undefined) {
        setValue(nextValue);
      }
    }
  };

  return (
    <button
      {...props}
      type="button"
      role="tab"
      id={getTabId(baseId, value)}
      aria-controls={getPanelId(baseId, value)}
      aria-selected={selected}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      disabled={disabled}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && !disabled) {
          setValue(value);
        }
      }}
      onKeyDown={handleKeyDown}
      className={[
        styles.trigger,
        selected && styles.selected,
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

// Content

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  forceMount?: boolean;
}

function TabsContent({
  value,
  children,
  forceMount = false,
  className = '',
  ...props
}: TabsContentProps) {
  const { value: selectedValue, baseId } = useTabsContext();

  const selected = selectedValue === value;

  if (!selected && !forceMount) {
    return null;
  }

  return (
    <div
      {...props}
      id={getPanelId(baseId, value)}
      role="tabpanel"
      aria-labelledby={getTabId(baseId, value)}
      tabIndex={0}
      hidden={!selected}
      className={`${styles.content} ${className}`}
    >
      {children}
    </div>
  );
}

export const Tabs = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
