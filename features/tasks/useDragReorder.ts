"use client";

import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export function useDragReorder<T>(
  items: T[],
  getId: (item: T) => string,
  onCommit: (orderedIds: string[]) => void
) {
  const [order, setOrder] = useState<T[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const itemRefs = useRef(new Map<string, HTMLElement>());
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setOrder(items);
    }
  }, [items]);

  function registerItemRef(id: string) {
    return (element: HTMLElement | null) => {
      if (element) {
        itemRefs.current.set(id, element);
      } else {
        itemRefs.current.delete(id);
      }
    };
  }

  function getHandleProps(id: string) {
    return {
      onPointerDown(event: ReactPointerEvent<HTMLElement>) {
        event.preventDefault();
        isDraggingRef.current = true;
        setDraggingId(id);

        function handlePointerMove(moveEvent: PointerEvent) {
          setOrder((prevOrder) => {
            const draggedIndex = prevOrder.findIndex((item) => getId(item) === id);
            if (draggedIndex === -1) return prevOrder;

            let targetIndex = prevOrder.length - 1;
            for (let index = 0; index < prevOrder.length; index += 1) {
              const element = itemRefs.current.get(getId(prevOrder[index]));
              if (!element) continue;
              const rect = element.getBoundingClientRect();
              const midPoint = rect.top + rect.height / 2;
              if (moveEvent.clientY < midPoint) {
                targetIndex = index;
                break;
              }
            }

            if (targetIndex === draggedIndex) return prevOrder;

            const next = [...prevOrder];
            const [movedItem] = next.splice(draggedIndex, 1);
            next.splice(targetIndex, 0, movedItem);
            return next;
          });
        }

        function handlePointerUp() {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);
          isDraggingRef.current = false;
          setDraggingId(null);
          setOrder((finalOrder) => {
            onCommit(finalOrder.map((item) => getId(item)));
            return finalOrder;
          });
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      },
    };
  }

  return { order, draggingId, registerItemRef, getHandleProps };
}
