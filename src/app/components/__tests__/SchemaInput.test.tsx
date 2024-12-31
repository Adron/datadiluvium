import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SchemaInput from '../SchemaInput';

// Mock react-dropzone
jest.mock('react-dropzone', () => ({
  useDropzone: ({ 
    onDrop, 
    accept 
  }: { 
    onDrop: (files: File[]) => void;
    accept: Record<string, string[]>;
  }) => {
    const dropHandler = (e: Event) => {
      const dropEvent = e as unknown as { dataTransfer: { files: FileList } };
      const files = dropEvent.dataTransfer.files;
      if (files && files.length) {
        onDrop(Array.from(files));
      }
    };

    return {
      getRootProps: () => ({
        onClick: jest.fn(),
        onDrop: dropHandler,
      }),
      getInputProps: () => ({
        accept,
        multiple: false,
      }),
      isDragActive: false,
    };
  },
}));

// Mock Modal component since it's a client component
jest.mock('../Modal', () => {
  return function MockModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    onConfirm: (name: string) => void; 
    title: string;
  }) {
    return (
      isOpen && (
        <div data-testid="modal">
          <h2>{title}</h2>
          <button onClick={() => onConfirm('test-schema')}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      )
    );
  };
});

describe('SchemaInput', () => {
  beforeEach(() => {
    // Clear any mocks
    jest.clearAllMocks();
  });

  describe('File Drop Functionality', () => {
    it('should handle SQL file drop and display contents', async () => {
      const sqlContent = 'CREATE TABLE test (id INT PRIMARY KEY);';
      const file = new File([sqlContent], 'test.sql', { type: 'text/plain' });
      
      render(<SchemaInput />);
      const dropzone = screen.getByPlaceholderText(/paste your schema/i).parentElement;
      expect(dropzone).toBeInTheDocument();

      // Create a drop event
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
          types: ['Files']
        }
      });

      // Fire the drop event
      fireEvent(dropzone!, dropEvent);

      // Wait for the file content to be displayed
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/paste your schema/i);
        expect(textarea).toHaveValue(sqlContent);
      });
    });

    it('should handle multiple files by taking only the first one', async () => {
      const sqlContent1 = 'CREATE TABLE test1 (id INT PRIMARY KEY);';
      const sqlContent2 = 'CREATE TABLE test2 (id INT PRIMARY KEY);';
      const file1 = new File([sqlContent1], 'test1.sql', { type: 'text/plain' });
      const file2 = new File([sqlContent2], 'test2.sql', { type: 'text/plain' });
      
      render(<SchemaInput />);
      const dropzone = screen.getByPlaceholderText(/paste your schema/i).parentElement;

      // Create a drop event with multiple files
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file1, file2],
          types: ['Files']
        }
      });

      // Fire the drop event
      fireEvent(dropzone!, dropEvent);

      // Wait for the first file's content to be displayed
      await waitFor(() => {
        const textarea = screen.getByPlaceholderText(/paste your schema/i);
        expect(textarea).toHaveValue(sqlContent1);
        expect(textarea).not.toHaveValue(sqlContent2);
      });
    });

    it('should clear previous content when new file is dropped', async () => {
      const initialContent = 'CREATE TABLE old (id INT);';
      const newContent = 'CREATE TABLE new (id INT);';
      const file = new File([newContent], 'new.sql', { type: 'text/plain' });
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      const dropzone = textarea.parentElement;

      // Set initial content
      fireEvent.change(textarea, { target: { value: initialContent } });
      expect(textarea).toHaveValue(initialContent);

      // Create and fire drop event
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
          types: ['Files']
        }
      });

      fireEvent(dropzone!, dropEvent);

      // Wait for new content
      await waitFor(() => {
        expect(textarea).not.toHaveValue(initialContent);
        expect(textarea).toHaveValue(newContent);
      });
    });

    it('should clear validation results when new file is dropped', async () => {
      const sqlContent = 'CREATE TABLE test (id INT);';
      const file = new File([sqlContent], 'test.sql', { type: 'text/plain' });
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      const dropzone = textarea.parentElement;

      // Set and validate initial content
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const validateButton = screen.getByText(/validate/i);
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/Schema is valid SQL/i)).toBeInTheDocument();
      });

      // Create and fire drop event
      const dropEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: {
          files: [file],
          types: ['Files']
        }
      });

      fireEvent(dropzone!, dropEvent);

      // Check that validation results are cleared
      await waitFor(() => {
        expect(screen.queryByText(/Schema is valid SQL/i)).not.toBeInTheDocument();
      });
    });
  });

  // ... rest of the existing tests ...
}); 