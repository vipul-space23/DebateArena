// frontend/src/hooks/useSpeechRecognition.js
import { useState, useEffect, useCallback, useRef } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useSpeechRecognition(onTranscript) {
    // isListening reflects the state reported by the browser API events (onstart, onend, onerror)
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);
    // Ref to track if we *intend* to be listening, controlled by start/stop calls
    const intentToListenRef = useRef(false);

    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn("Speech Recognition API not supported by this browser.");
            return undefined; // Indicate unsupported
        }

        console.log("Setting up SpeechRecognition instance.");
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;

        // --- Configuration ---
        recognition.continuous = true; // Try to keep running
        recognition.interimResults = false; // Process only final results
        recognition.lang = 'en-US'; // Optional: specify language

        // --- Event Handlers ---
        recognition.onstart = () => {
            console.log("STT Service reported: START");
            setIsListening(true); // Update state when service confirms start
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            // Process results robustly
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            const trimmedTranscript = finalTranscript.trim();
            if (trimmedTranscript && typeof onTranscript === 'function') {
                onTranscript(trimmedTranscript);
            } else if (trimmedTranscript) {
                 console.warn("STT: Final transcript received but onTranscript is not a function.");
            }
        };

        recognition.onerror = (event) => {
            console.error(`STT Service reported: ERROR - ${event.error}: ${event.message || '(no message)'}`);
            // Ensure state is false on error, as 'onend' might not follow all errors
            setIsListening(false);
            intentToListenRef.current = false; // Assume intent should stop on error

            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                alert("Speech recognition permission denied or service unavailable. Please check browser settings.");
            }
            // Other errors like 'network', 'audio-capture', 'no-speech' will just stop listening.
            // The controlling component (App.jsx) might retry via its useEffect if conditions allow.
        };

        recognition.onend = () => {
            console.log("STT Service reported: END");
            // Reliably set state to false when the service stops for any reason
            setIsListening(false);
            // --- NO AUTOMATIC RESTART LOGIC ---
        };

        // --- Cleanup Function ---
        return () => {
            if (recognitionRef.current) {
                console.log("Cleaning up SpeechRecognition instance.");
                // Remove all listeners
                recognitionRef.current.onstart = null;
                recognitionRef.current.onresult = null;
                recognitionRef.current.onerror = null;
                recognitionRef.current.onend = null;
                // Stop/abort any active recognition
                recognitionRef.current.abort(); // Force stop
                recognitionRef.current = null;
            }
            intentToListenRef.current = false; // Reset intent on unmount
        };

    }, [onTranscript]); // Effect dependency

    // --- Control Functions Exposed by the Hook ---

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            console.warn("STT: Cannot start, recognition not initialized.");
            return;
        }
        // Check the *intent* and the *actual state*
        if (intentToListenRef.current && isListening) {
            // console.log("STT: Already listening and intent is true, doing nothing."); // Reduce console noise
            return;
        }
        if (!intentToListenRef.current) {
             console.log("STT: Setting intent to listen.");
             intentToListenRef.current = true; // Set intent if not already set
        }

        // Attempt to start only if not currently listening according to state
        if (!isListening) {
            try {
                console.log("STT: Calling recognition.start()...");
                recognitionRef.current.start();
                // State will update via 'onstart' handler
            } catch (e) {
                console.error("STT: Error calling recognition.start():", e);
                 // If start fails immediately (e.g., edge case InvalidStateError), reset intent and state
                 intentToListenRef.current = false;
                 setIsListening(false);
            }
        } else {
            // console.log("STT: startListening called but isListening state is true, start() skipped."); // Reduce noise
        }
    }, [isListening]); // Depend on isListening state

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) {
             console.warn("STT: Cannot stop, recognition not initialized.");
            return;
        }
        // console.log("STT: Setting intent to stop listening."); // Reduce noise
        intentToListenRef.current = false; // Set intent

        // Attempt to stop only if currently listening according to state
        if (isListening) {
            try {
                console.log("STT: Calling recognition.stop()...");
                recognitionRef.current.stop();
                // State will update via 'onend' handler
            } catch (e) {
                console.error("STT: Error calling recognition.stop():", e);
                // Force state update if stop fails, although onend should fire
                setIsListening(false);
            }
        } else {
             // If stop is called when not listening, ensure state is false anyway
             setIsListening(false);
        }
    }, [isListening]); // Depend on isListening state

    return { isListening, startListening, stopListening };
}