import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../page';
import SchemaPage from '../schema/page';
import GeneratePage from '../generate/page';

// Mock the Navigation component since it uses 'use client'
jest.mock('../components/Navigation', () => {
  return function MockNavigation() {
    return <nav data-testid="navigation">Navigation Mock</nav>;
  };
});

// Mock the SchemaInput component since it uses 'use client'
jest.mock('../components/SchemaInput', () => {
  return function MockSchemaInput() {
    return <div data-testid="schema-input">Schema Input Mock</div>;
  };
});

describe('Pages', () => {
  describe('Home Page', () => {
    it('renders without crashing', () => {
      render(<Home />);
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    it('renders main content sections', () => {
      render(<Home />);
      expect(screen.getByRole('heading', { name: /Schema from\.\.\./i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Generate to\.\.\./i })).toBeInTheDocument();
    });
  });

  describe('Schema Page', () => {
    it('renders without crashing', () => {
      render(<SchemaPage />);
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    it('renders schema input component', () => {
      render(<SchemaPage />);
      expect(screen.getByTestId('schema-input')).toBeInTheDocument();
    });

    it('renders page title', () => {
      render(<SchemaPage />);
      expect(screen.getByRole('heading', { level: 1, name: /Schema from/i })).toBeInTheDocument();
    });
  });

  describe('Generate Page', () => {
    it('renders without crashing', () => {
      render(<GeneratePage />);
      expect(screen.getByTestId('navigation')).toBeInTheDocument();
    });

    it('renders page title', () => {
      render(<GeneratePage />);
      expect(screen.getByRole('heading', { level: 1, name: /Generate to/i })).toBeInTheDocument();
    });
  });
}); 