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

import styles from './Accordion.module.css';

export type AccordionType = 'single' | 'multiple';

interface AccordionItemContextValue {
  value: string;
  open: boolean;
  disabled: boolean;
  triggerId: string;
  contentId: string;
  toggle: () => void;
}

interface AccordionContextValue {
  type: AccordionType;
  openValues: string[];
  toggle: (value: string) => void;
  collapsible: boolean;
  disabled: boolean;
  rootId: string;
  registerTrigger: (value: string, element: HTMLButtonElement | null) => void;
  getEnabledTriggers: () => HTMLButtonElement[];
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

const AccordionItemContext = createContext<AccordionItemContextValue | null>(null);

function useAccordionContext() {
  const context = useContext(AccordionContext);

  if (!context) {
    throw new Error('Accordion components must be used within Accordion.');
  }

  return context;
}

function useAccordionItemContext() {
  const context = useContext(AccordionItemContext);

  if (!context) {
    throw new Error(
      'Accordion.Trigger and Accordion.Content must be used within Accordion.Item.',
    );
  }

  return context;
}

// Root

interface AccordionBaseProps {
  children: ReactNode;
  collapsible?: boolean;
  disabled?: boolean;
}

interface SingleAccordionProps extends AccordionBaseProps {
  type?: 'single';
  value?: string | null;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
}

interface MultipleAccordionProps extends AccordionBaseProps {
  type: 'multiple';
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
}

export type AccordionProps = SingleAccordionProps | MultipleAccordionProps;

function AccordionRoot(props: AccordionProps) {
  const { children, collapsible = true, disabled = false } = props;

  const type = props.type ?? 'single';

  const [singleState, setSingleState] = useState<string | null>(
    props.type === 'multiple' ? null : (props.defaultValue ?? null),
  );

  const [multipleState, setMultipleState] = useState<string[]>(
    props.type === 'multiple' ? (props.defaultValue ?? []) : [],
  );

  const isControlled = props.value !== undefined;

  const openValues =
    type === 'single'
      ? [(isControlled ? props.value : singleState) as string | null].filter(
          (value): value is string => value !== null,
        )
      : ((isControlled ? props.value : multipleState) as string[]);

  const rootId = useId();

  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());

  const registerTrigger = useCallback(
    (value: string, element: HTMLButtonElement | null) => {
      if (element) {
        triggerRefs.current.set(value, element);
      } else {
        triggerRefs.current.delete(value);
      }
    },
    [],
  );

  const getEnabledTriggers = useCallback(() => {
    return Array.from(triggerRefs.current.values()).filter(
      (element) => !element.disabled,
    );
  }, []);

  const toggle = useCallback(
    (itemValue: string) => {
      if (disabled) {
        return;
      }

      if (type === 'single') {
        const currentValue = openValues[0] ?? null;

        if (currentValue === itemValue) {
          if (!collapsible) {
            return;
          }

          if (!isControlled) {
            setSingleState(null);
          }

          if (props.type !== 'multiple') {
            props.onValueChange?.(null);
          }

          return;
        }

        if (!isControlled) {
          setSingleState(itemValue);
        }

        if (props.type !== 'multiple') {
          props.onValueChange?.(itemValue);
        }

        return;
      }

      const currentValues = openValues;
      const nextValues = currentValues.includes(itemValue)
        ? currentValues.filter((value) => value !== itemValue)
        : [...currentValues, itemValue];

      if (!isControlled) {
        setMultipleState(nextValues);
      }

      if (props.type === 'multiple') {
        props.onValueChange?.(nextValues);
      }
    },
    [disabled, type, openValues, collapsible, isControlled, props],
  );

  const contextValue = useMemo<AccordionContextValue>(
    () => ({
      type,
      openValues,
      toggle,
      collapsible,
      disabled,
      rootId,
      registerTrigger,
      getEnabledTriggers,
    }),
    [
      type,
      openValues,
      toggle,
      collapsible,
      disabled,
      rootId,
      registerTrigger,
      getEnabledTriggers,
    ],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div className={styles.root}>{children}</div>
    </AccordionContext.Provider>
  );
}

// Item

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
}

function AccordionItem({
  value,
  disabled = false,
  children,
  className = '',
  ...props
}: AccordionItemProps) {
  const { openValues, toggle, disabled: rootDisabled, rootId } = useAccordionContext();

  const open = openValues.includes(value);
  const itemDisabled = disabled || rootDisabled;

  const contextValue = useMemo<AccordionItemContextValue>(
    () => ({
      value,
      open,
      disabled: itemDisabled,
      triggerId: `${rootId}-trigger-${encodeURIComponent(value)}`,
      contentId: `${rootId}-content-${encodeURIComponent(value)}`,
      toggle: () => toggle(value),
    }),
    [value, open, itemDisabled, rootId, toggle],
  );

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <div
        {...props}
        data-state={open ? 'open' : 'closed'}
        data-disabled={itemDisabled || undefined}
        className={`${styles.item} ${className}`}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// Trigger

export interface AccordionTriggerProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'value'
> {}

function AccordionTrigger({
  children,
  className = '',
  onClick,
  onKeyDown,
  ...props
}: AccordionTriggerProps) {
  const { value, open, disabled, triggerId, contentId, toggle } =
    useAccordionItemContext();

  const { registerTrigger, getEnabledTriggers } = useAccordionContext();

  const setRef = useCallback(
    (element: HTMLButtonElement | null) => {
      registerTrigger(value, element);
    },
    [registerTrigger, value],
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const triggers = getEnabledTriggers();
    const currentIndex = triggers.indexOf(event.currentTarget);

    if (currentIndex === -1) {
      return;
    }

    let nextIndex: number | undefined;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % triggers.length;
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
        break;

      case 'Home':
        nextIndex = 0;
        break;

      case 'End':
        nextIndex = triggers.length - 1;
        break;

      default:
        return;
    }

    event.preventDefault();
    triggers[nextIndex]?.focus();
  };

  return (
    <h3 className={styles.heading}>
      <button
        {...props}
        ref={setRef}
        id={triggerId}
        type="button"
        aria-controls={contentId}
        aria-expanded={open}
        disabled={disabled}
        onClick={(event) => {
          onClick?.(event);

          if (!event.defaultPrevented && !disabled) {
            toggle();
          }
        }}
        onKeyDown={handleKeyDown}
        className={`${styles.trigger} ${className}`}
      >
        <span className={styles.triggerContent}>{children}</span>

        <span className={styles.chevron} aria-hidden="true" />
      </button>
    </h3>
  );
}

// Content

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {}

function AccordionContent({ children, className = '', ...props }: AccordionContentProps) {
  const { open, triggerId, contentId } = useAccordionItemContext();

  return (
    <div
      {...props}
      id={contentId}
      role="region"
      aria-labelledby={triggerId}
      aria-hidden={!open}
      inert={!open}
      data-state={open ? 'open' : 'closed'}
      className={styles.content}
    >
      <div className={styles.contentInner}>
        <div className={`${styles.contentBody} ${className}`}>{children}</div>
      </div>
    </div>
  );
}

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
