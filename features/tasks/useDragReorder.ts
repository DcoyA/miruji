"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export function useDragReorder<T>(
  items: T[],
  getId: (item: T) => string,
  onCommit: (orderedIds: string[]) => void
) {
  const [order, setOrder] = useState<T[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [shiftMap, setShiftMap] = useState<Map<string, number>>(new Map());
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
        const startClientY = event.clientY;
        const startIndex = order.findIndex((item) => getId(item) === id);
        if (startIndex === -1) return;

        // 드래그 시작 시점의 "고정된" 위치값을 미리 다 찍어둡니다.
        // 드래그 중에는 이 값만 참조하고, 실제 DOM 위치는 다시 재지 않습니다.
        // (다른 카드들에 transform이 걸려 있으면 getBoundingClientRect 값이
        //  흔들려서 목표 인덱스 계산이 틀어지기 때문입니다.)
        const originalRects = new Map<string, DOMRect>();
        order.forEach((item) => {
          const itemId = getId(item);
          const element = itemRefs.current.get(itemId);
          if (element) originalRects.set(itemId, element.getBoundingClientRect());
        });
        const draggedRect = originalRects.get(id);
        if (!draggedRect) return;
        const draggedHeight = draggedRect.height;

        isDraggingRef.current = true;
        setDraggingId(id);
        setDragOffsetY(0);

        let targetIndex = startIndex;

        function handlePointerMove(moveEvent: PointerEvent) {
          const deltaY = moveEvent.clientY - startClientY;
          setDragOffsetY(deltaY);

          const draggedCenterY = draggedRect.top + draggedRect.height / 2 + deltaY;

          let nextTargetIndex = startIndex;
          for (let index = 0; index < order.length; index += 1) {
            if (index === startIndex) continue;
            const rect = originalRects.get(getId(order[index]));
            if (!rect) continue;
            const midPoint = rect.top + rect.height / 2;
            if (draggedCenterY > midPoint) {
              nextTargetIndex = index;
            }
          }
          targetIndex = nextTargetIndex;

          const nextShiftMap = new Map<string, number>();
          if (targetIndex > startIndex) {
            for (let index = startIndex + 1; index <= targetIndex; index += 1) {
              nextShiftMap.set(getId(order[index]), -draggedHeight);
            }
          } else if (targetIndex < startIndex) {
            for (let index = targetIndex; index < startIndex; index += 1) {
              nextShiftMap.set(getId(order[index]), draggedHeight);
            }
          }
          setShiftMap(nextShiftMap);
        }

        function handlePointerUp() {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);
          isDraggingRef.current = false;
          setDraggingId(null);
          setDragOffsetY(0);
          setShiftMap(new Map());

          if (targetIndex !== startIndex) {
            setOrder((prevOrder) => {
              const next = [...prevOrder];
              const [movedItem] = next.splice(startIndex, 1);
              next.splice(targetIndex, 0, movedItem);
              onCommit(next.map((item) => getId(item)));
              return next;
            });
          }
        }

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      },
    };
  }

  function getItemStyle(id: string): CSSProperties {
    if (id === draggingId) {
      return {
        transform: `translateY(${dragOffsetY}px) scale(1.03)`,
        transition: "none",
        position: "relative",
        zIndex: 20,
        boxShadow: "0 14px 28px rgba(108, 99, 255, 0.30)",
      };
    }
    const shift = shiftMap.get(id) ?? 0;
    return {
      transform: `translateY(${shift}px)`,
      transition: "transform 180ms ease, box-shadow 180ms ease",
      position: "relative",
      zIndex: 1,
    };
  }

  return { order, draggingId, getItemStyle, registerItemRef, getHandleProps };
}
