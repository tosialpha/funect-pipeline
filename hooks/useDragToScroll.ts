import { useRef, useEffect, useCallback, RefObject } from "react";

interface DragToScrollOptions {
  /** Speed multiplier for scrolling (default: 1) */
  speed?: number;
  /** Disable drag-to-scroll when true */
  disabled?: boolean;
}

interface DragToScrollReturn {
  /** Ref to attach to the scrollable container */
  ref: RefObject<HTMLDivElement>;
  /** Whether the user is currently dragging */
  isDragging: boolean;
}

/**
 * Custom hook to enable click-and-drag scrolling on a container.
 * Useful for horizontal scrolling areas where the scrollbar is far from the content.
 */
export function useDragToScroll(options: DragToScrollOptions = {}): DragToScrollReturn {
  const { speed = 1, disabled = false } = options;
  const ref = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (disabled) return;

    const element = ref.current;
    if (!element) return;

    // Don't start drag if clicking on an interactive element
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest("input") ||
      target.closest("textarea") ||
      target.closest("a") ||
      target.closest("[data-no-drag-scroll]") ||
      target.closest('[draggable="true"]')
    ) {
      return;
    }

    isDraggingRef.current = true;
    startXRef.current = e.pageX - element.offsetLeft;
    startYRef.current = e.pageY - element.offsetTop;
    scrollLeftRef.current = element.scrollLeft;
    scrollTopRef.current = element.scrollTop;
    element.style.cursor = "grabbing";
    element.style.userSelect = "none";
  }, [disabled]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current || disabled) return;

    const element = ref.current;
    if (!element) return;

    e.preventDefault();
    const x = e.pageX - element.offsetLeft;
    const y = e.pageY - element.offsetTop;
    const walkX = (x - startXRef.current) * speed;
    const walkY = (y - startYRef.current) * speed;
    element.scrollLeft = scrollLeftRef.current - walkX;
    element.scrollTop = scrollTopRef.current - walkY;
  }, [disabled, speed]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
    const element = ref.current;
    if (element) {
      element.style.cursor = "grab";
      element.style.userSelect = "";
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      const element = ref.current;
      if (element) {
        element.style.cursor = "grab";
        element.style.userSelect = "";
      }
    }
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || disabled) return;

    element.style.cursor = "grab";

    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("mousemove", handleMouseMove);
    element.addEventListener("mouseup", handleMouseUp);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("mousemove", handleMouseMove);
      element.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("mouseleave", handleMouseLeave);
      element.style.cursor = "";
    };
  }, [disabled, handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave]);

  return {
    ref,
    isDragging: isDraggingRef.current,
  };
}
