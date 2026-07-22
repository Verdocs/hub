import { render, screen } from '@testing-library/react';
import TemplateTags from './TemplateTags';

describe('TemplateTags', () => {
  it('renders a chip per tag', () => {
    render(<TemplateTags tags={['onboarding', 'human-resources', 'signed-2026']} />);

    expect(screen.getByText('onboarding')).toBeInTheDocument();
    expect(screen.getByText('human-resources')).toBeInTheDocument();
    expect(screen.getByText('signed-2026')).toBeInTheDocument();
  });

  it('renders an empty container when there are no tags', () => {
    const { container } = render(<TemplateTags />);

    expect(container.firstElementChild).toBeEmptyDOMElement();
  });

  it('passes through container attributes', () => {
    render(<TemplateTags tags={['legal']} data-testid="tags" className="custom-class" />);

    expect(screen.getByTestId('tags')).toHaveClass('custom-class');
  });
});
