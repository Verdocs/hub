import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('renders the label and percentage above the bar', () => {
    render(<ProgressBar label="Uploading..." showPercent percent={54} />);

    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(screen.getByText(/54\s*%/)).toBeInTheDocument();

    const bar = screen.getByRole('progressbar', { name: 'Uploading...' });
    expect(bar).toHaveAttribute('aria-valuenow', '54');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps the reported progress to 100', () => {
    render(<ProgressBar percent={150} />);

    expect(screen.getByRole('progressbar', { name: 'Progress' })).toHaveAttribute('aria-valuenow', '100');
  });

  it('omits the labels row when neither label nor percentage is requested', () => {
    render(<ProgressBar percent={25} />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  });
});
