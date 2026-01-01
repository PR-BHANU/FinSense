import VoiceToText, {
  VoiceToTextEvents,
} from '@appcitor/react-native-voice-to-text';

let listenersAttached = false;
let currentCallback: ((text: string) => void) | null = null;
let currentErrorCallback: ((error: any) => void) | null = null;
let currentStartCallback: (() => void) | null = null;
let currentEndCallback: (() => void) | null = null;

function attachListenersOnce() {
  if (listenersAttached) return;
  listenersAttached = true;

  VoiceToText.addEventListener(VoiceToTextEvents.START, () => {
    if (currentStartCallback) {
      currentStartCallback();
    }
  });

  VoiceToText.addEventListener(VoiceToTextEvents.END, () => {
    if (currentEndCallback) {
      currentEndCallback();
    }
  });

  VoiceToText.addEventListener(VoiceToTextEvents.RESULTS, event => {
    const text =
      event?.value ?? event?.results?.transcriptions?.[0]?.text ?? '';
    if (currentCallback && text) {
      currentCallback(text);
    }
  });

  VoiceToText.addEventListener(VoiceToTextEvents.ERROR, error => {
    if (currentErrorCallback) {
      currentErrorCallback(error);
    }
  });
}

export function setVoiceCallbacks(
  onStart: () => void,
  onEnd: () => void,
  onResult: (text: string) => void,
  onError: (error: any) => void,
) {
  attachListenersOnce();
  currentStartCallback = onStart;
  currentEndCallback = onEnd;
  currentCallback = onResult;
  currentErrorCallback = onError;
}

export function clearVoiceCallbacks() {
  currentStartCallback = null;
  currentEndCallback = null;
  currentCallback = null;
  currentErrorCallback = null;
}

export async function startVoice() {
  await VoiceToText.setRecognitionLanguage('en-IN');
  await VoiceToText.startListening();
}

export async function stopVoice() {
  try {
    await VoiceToText.stopListening();
  } catch (error) {}
}
