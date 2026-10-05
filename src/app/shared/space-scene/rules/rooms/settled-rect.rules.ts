export const settledRect = (el: Element): DOMRect => {
  const was = el.getAnimations().map((animation) => {
    const time = animation.currentTime;
    const end = animation.effect?.getComputedTiming().endTime as number;
    if (end < Infinity) {
      animation.currentTime = end;
    }
    return [animation, time] as const;
  });
  const rect = el.getBoundingClientRect();
  for (const [animation, time] of was) {
    animation.currentTime = time;
  }
  return rect;
};
