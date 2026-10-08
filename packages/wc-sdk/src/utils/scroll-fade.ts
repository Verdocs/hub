/**
 * Fade the bottom edge of a scrolling region only while there is more content
 * below the fold, so a view that fits shows no decoration at all.
 *
 * The marker class lands on the region's parent, which carries the `group`
 * utility, and the fade element reacts to it with
 * `vdocs:group-[.vdocs-scroll-more]:opacity-100`. It goes straight onto the DOM
 * rather than into reactive state, so calling this after every render and on
 * every scroll event cannot loop.
 */
export const updateScrollFade = (body: HTMLElement | null | undefined) => {
  const wrap = body?.parentElement;
  if (!body || !wrap) {
    return;
  }

  const scrollable = body.scrollHeight > body.clientHeight + 1;
  const atEnd = body.scrollTop + body.clientHeight >= body.scrollHeight - 1;
  wrap.classList.toggle('vdocs-scroll-more', scrollable && !atEnd);
};
