import { createWorkletModuleLoader } from "./createWorkletModuleLoader";
import { WORKLET_HASHES, WORKLET_SOURCES } from "../worklet-hashes";

// Install the file in your public directory to avoid blob: and data: usage
const DEFAULT_WORKLET_URL = "/worklets/audio-concat-processor.worklet.js";

export const loadAudioConcatProcessor = createWorkletModuleLoader(
  "audio-concat-processor",
  DEFAULT_WORKLET_URL,
  WORKLET_HASHES["audio-concat-processor"],
  WORKLET_SOURCES["audio-concat-processor"]
);
