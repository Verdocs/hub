import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import Button from './Button';
import Portal from './Portal';

const meta = {
  title: 'Controls/Portal',
  component: Portal,
  args: { anchor: null },
} satisfies Meta<typeof Portal>;

export default meta;
type Story = StoryObj<typeof meta>;

function AnchoredContentDemo() {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  return (
    <div style={{ padding: 40 }}>
      <div ref={anchorRef} style={{ display: 'inline-block' }}>
        <Button label={open ? 'Hide content' : 'Show content'} onClick={() => setOpen(!open)} />
      </div>

      {open && (
        <Portal anchor={anchorRef} onClickAway={() => setOpen(false)}>
          <div className="vdocs:mt-1 vdocs:p-2.5 vdocs:text-sm vdocs:font-sans vdocs:text-ink vdocs:bg-surface vdocs:border vdocs:border-solid vdocs:border-edge-light vdocs:rounded-ctl vdocs:shadow-lg">
            Anchored floating content. Click anywhere else to dismiss it.
          </div>
        </Portal>
      )}
    </div>
  );
}

export const Basic: Story = {
  render: () => <AnchoredContentDemo />,
};
