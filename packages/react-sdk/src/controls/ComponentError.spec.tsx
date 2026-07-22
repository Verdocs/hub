import { render, screen } from '@testing-library/react';
import ComponentError from './ComponentError';

describe('ComponentError', () => {
  it('announces the message as an alert', () => {
    render(<ComponentError message="Something went wrong." />);

    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong.');
  });
});
