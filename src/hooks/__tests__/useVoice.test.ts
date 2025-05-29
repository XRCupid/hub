import { renderHook, act } from '@testing-library/react-hooks';
import { useVoice } from '../useVoice';

describe('useVoice', () => {
  // Mock SpeechRecognition
  const mockStart = jest.fn();
  const mockStop = jest.fn();
  const mockOnResult = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock SpeechRecognition
    global.SpeechRecognition = class {
      continuous = true;
      interimResults = true;
      lang = 'en-US';
      onstart = jest.fn();
      onend = jest.fn();
      onresult = mockOnResult;
      onerror = jest.fn();
      start = mockStart;
      stop = mockStop;
    } as any;

    // Mock speechSynthesis
    global.speechSynthesis = {
      speak: jest.fn((utterance: any) => {
        if (utterance.onstart) utterance.onstart();
        setTimeout(() => {
          if (utterance.onend) utterance.onend({} as SpeechSynthesisEvent);
        }, 100);
      }),
      cancel: jest.fn(),
    } as any;
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useVoice());
    
    expect(result.current.isListening).toBe(false);
    expect(result.current.isSpeaking).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.error).toBeNull();
  });

  it('starts and stops listening', () => {
    const { result } = renderHook(() => useVoice());
    
    // Start listening
    act(() => {
      result.current.startListening();
    });
    
    expect(result.current.isListening).toBe(true);
    expect(mockStart).toHaveBeenCalled();
    
    // Stop listening
    act(() => {
      result.current.stopListening();
    });
    
    expect(result.current.isListening).toBe(false);
    expect(mockStop).toHaveBeenCalled();
  });

  it('handles speech recognition results', () => {
    const { result } = renderHook(() => useVoice());
    
    // Simulate a recognition result
    const mockEvent = {
      results: [{
        0: { transcript: 'Hello world' },
        isFinal: true,
      }],
      resultIndex: 0
    };
    
    act(() => {
      // @ts-ignore - Mock event structure
      mockOnResult(mockEvent);
    });
    
    expect(result.current.transcript).toBe('Hello world');
  });

  it('speaks text', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVoice());
    
    await act(async () => {
      result.current.speak('Hello world');
      await waitForNextUpdate();
    });
    
    expect(speechSynthesis.speak).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false); // Should be false after speaking completes
  });
});
