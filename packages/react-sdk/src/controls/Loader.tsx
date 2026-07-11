// The legacy loader animated a ring of box-shadows through eight keyframe stops. Spinning a
// static ring of dots with the stock spin animation looks the same and saves us defining
// bespoke keyframes in the shared stylesheet. The first dot is the bright head; the last two
// entries are the tail fading behind it as the ring rotates clockwise.
const DOT_CLASSES = [
  'vdocs:top-[-60px] vdocs:left-0 vdocs:bg-edge',
  'vdocs:top-[-42px] vdocs:left-[42px] vdocs:bg-ink/20',
  'vdocs:top-0 vdocs:left-[60px] vdocs:bg-ink/20',
  'vdocs:top-[42px] vdocs:left-[42px] vdocs:bg-ink/20',
  'vdocs:top-[60px] vdocs:left-0 vdocs:bg-ink/20',
  'vdocs:top-[42px] vdocs:left-[-42px] vdocs:bg-ink/20',
  'vdocs:top-0 vdocs:left-[-60px] vdocs:bg-ink/30',
  'vdocs:top-[-42px] vdocs:left-[-42px] vdocs:bg-ink/40',
];

/**
 * Animated loader placeholder. It centers itself within the nearest positioned
 * ancestor. There are currently no configuration options for this control.
 */
export default function Loader() {
  return (
    <div role="status" aria-label="Loading" className="vdocs:absolute vdocs:top-1/2 vdocs:left-1/2 vdocs:-mt-3 vdocs:-ml-3 vdocs:size-6">
      <div className="vdocs:relative vdocs:size-6 vdocs:animate-spin">
        {DOT_CLASSES.map(dot => (
          <div key={dot} className={`vdocs:absolute vdocs:size-6 vdocs:rounded-full ${dot}`} />
        ))}
      </div>
    </div>
  );
}
