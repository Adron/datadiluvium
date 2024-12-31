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

  describe('Generator Validation', () => {
    it('should show validation modal when generators are not selected', async () => {
      const sqlContent = 'CREATE TABLE test (id INT, name VARCHAR(50));';
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add schema and process it
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Try to generate data without selecting generators
      const generateButton = screen.getByText(/generate data/i);
      fireEvent.click(generateButton);

      // Check if validation modal is shown with correct content
      await waitFor(() => {
        expect(screen.getByText(/Missing Generator Selections/i)).toBeInTheDocument();
        expect(screen.getByText(/Please select generators for the following columns/i)).toBeInTheDocument();
        expect(screen.getByText(/test\.id/i)).toBeInTheDocument();
        expect(screen.getByText(/test\.name/i)).toBeInTheDocument();
      });
    });

    it('should not show validation modal when all generators are selected', async () => {
      const sqlContent = 'CREATE TABLE test (id INT, name VARCHAR(50));';
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add schema and process it
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Select generators for all columns
      const generatorSelects = screen.getAllByRole('combobox');
      fireEvent.change(generatorSelects[0], { target: { value: 'sequence' } });
      fireEvent.change(generatorSelects[1], { target: { value: 'faker' } });

      // Try to generate data
      const generateButton = screen.getByText(/generate data/i);
      fireEvent.click(generateButton);

      // Check that validation modal is not shown
      expect(screen.queryByText(/Missing Generator Selections/i)).not.toBeInTheDocument();
    });

    it('should close validation modal when OK is clicked', async () => {
      const sqlContent = 'CREATE TABLE test (id INT);';
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add schema and process it
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Try to generate data without selecting generator
      const generateButton = screen.getByText(/generate data/i);
      fireEvent.click(generateButton);

      // Wait for modal and click OK
      await waitFor(() => {
        const okButton = screen.getByText(/^OK$/);
        fireEvent.click(okButton);
      });

      // Check that modal is closed
      expect(screen.queryByText(/Missing Generator Selections/i)).not.toBeInTheDocument();
    });

    it('should list only columns without generators in validation modal', async () => {
      const sqlContent = 'CREATE TABLE test (id INT, name VARCHAR(50), age INT);';
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add schema and process it
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Select generator for only one column
      const generatorSelects = screen.getAllByRole('combobox');
      fireEvent.change(generatorSelects[1], { target: { value: 'faker' } }); // Select for 'name'

      // Try to generate data
      const generateButton = screen.getByText(/generate data/i);
      fireEvent.click(generateButton);

      // Check that only columns without generators are listed
      await waitFor(() => {
        expect(screen.getByText(/test\.id/i)).toBeInTheDocument();
        expect(screen.getByText(/test\.age/i)).toBeInTheDocument();
        expect(screen.queryByText(/test\.name/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Schema Saving', () => {
    beforeEach(() => {
      localStorage.clear();
      // Clear any mocks
      jest.clearAllMocks();
    });

    it('should save schema to localStorage when save button is clicked', async () => {
      const sqlContent = 'CREATE TABLE test (id INT, name VARCHAR(50));';
      const schemaName = 'Test Schema';
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add schema and process it
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Click save button and enter schema name
      const saveButton = screen.getByText(/save schema/i);
      fireEvent.click(saveButton);

      // Wait for modal and enter schema name
      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: schemaName } });
        const modalSaveButton = screen.getByText(/^Save$/);
        fireEvent.click(modalSaveButton);
      });

      // Check localStorage
      const savedSchemas = JSON.parse(localStorage.getItem('savedSchemas') || '{}');
      expect(savedSchemas[schemaName]).toBeDefined();
      expect(savedSchemas[schemaName].sql).toBe(sqlContent);
      expect(savedSchemas[schemaName].columns).toHaveLength(2);
    });

    it('should not save schema if name is empty', async () => {
      const sqlContent = 'CREATE TABLE test (id INT);';
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add schema and process it
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Click save button without entering name
      const saveButton = screen.getByText(/save schema/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        const modalSaveButton = screen.getByText(/^Save$/);
        fireEvent.click(modalSaveButton);
      });

      // Check localStorage is empty
      const savedSchemas = JSON.parse(localStorage.getItem('savedSchemas') || '{}');
      expect(Object.keys(savedSchemas)).toHaveLength(0);
    });

    it('should dispatch schemasUpdated event when schema is saved', async () => {
      const sqlContent = 'CREATE TABLE test (id INT);';
      const schemaName = 'Test Schema';
      const eventListener = jest.fn();
      
      window.addEventListener('schemasUpdated', eventListener);
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add schema and process it
      fireEvent.change(textarea, { target: { value: sqlContent } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Click save button and enter schema name
      const saveButton = screen.getByText(/save schema/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: schemaName } });
        const modalSaveButton = screen.getByText(/^Save$/);
        fireEvent.click(modalSaveButton);
      });

      expect(eventListener).toHaveBeenCalled();
      
      window.removeEventListener('schemasUpdated', eventListener);
    });

    it('should update existing schema if name already exists', async () => {
      const initialSQL = 'CREATE TABLE test (id INT);';
      const updatedSQL = 'CREATE TABLE test (id INT, name VARCHAR(50));';
      const schemaName = 'Test Schema';
      
      // Save initial schema
      localStorage.setItem('savedSchemas', JSON.stringify({
        [schemaName]: {
          sql: initialSQL,
          timestamp: new Date().toISOString(),
          columns: [{ tableName: 'test', columnName: 'id', dataType: 'INT' }]
        }
      }));
      
      render(<SchemaInput />);
      const textarea = screen.getByPlaceholderText(/paste your schema/i);
      
      // Add updated schema and process it
      fireEvent.change(textarea, { target: { value: updatedSQL } });
      const processButton = screen.getByText(/process schema/i);
      fireEvent.click(processButton);

      // Save with same name
      const saveButton = screen.getByText(/save schema/i);
      fireEvent.click(saveButton);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        fireEvent.change(input, { target: { value: schemaName } });
        const modalSaveButton = screen.getByText(/^Save$/);
        fireEvent.click(modalSaveButton);
      });

      // Check localStorage has updated schema
      const savedSchemas = JSON.parse(localStorage.getItem('savedSchemas') || '{}');
      expect(savedSchemas[schemaName].sql).toBe(updatedSQL);
      expect(savedSchemas[schemaName].columns).toHaveLength(2);
    });
  });
}); 