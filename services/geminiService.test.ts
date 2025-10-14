import { vi } from 'vitest';
import { runAiChat, generateDocumentContent } from './geminiService';
import type { Room, Booking, Guest } from '../types';

const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => {
  const mockGoogleGenAI = vi.fn(() => ({
    models: {
      get generateContent() {
        return mockGenerateContent;
      },
    },
  }));

  return {
    GoogleGenAI: mockGoogleGenAI,
    FinishReason: {
      OTHER: 'OTHER',
    },
    Type: {
      OBJECT: 'OBJECT',
    },
  };
});

describe('geminiService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('runAiChat', () => {
    it('should return a successful response from the AI', async () => {
      const mockResponse = { text: 'AI Response' };
      mockGenerateContent.mockResolvedValue(mockResponse);

      const response = await runAiChat([], { rooms: [], bookings: [], guests: [] });
      expect(response).toEqual(mockResponse);
    });

    it('should handle errors and return a fallback response', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));
      const response = await runAiChat([], { rooms: [], bookings: [], guests: [] });
      expect(response.text).toContain('เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI Assistant');
    });
  });

  describe('generateDocumentContent', () => {
    it('should return generated content successfully', async () => {
      const mockResponse = { text: 'Generated Document' };
      mockGenerateContent.mockResolvedValue(mockResponse);
      const content = await generateDocumentContent('Test Prompt');
      expect(content).toBe('Generated Document');
    });

    it('should handle errors and return an error message', async () => {
      mockGenerateContent.mockRejectedValue(new Error('API Error'));
      const content = await generateDocumentContent('Test Prompt');
      expect(content).toBe('Error: Could not generate document content.');
    });
  });
});
