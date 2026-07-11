import { render, screen } from '@testing-library/react';
import Loader from './Loader';

describe('Loader', () => {
  it('announces itself as a loading status indicator', () => {
    render(<Loader />);

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });
});
