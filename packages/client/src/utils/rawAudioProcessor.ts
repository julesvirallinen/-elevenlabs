import { createWorkletModuleLoader } from "./createWorkletModuleLoader";
import { WORKLET_HASHES, WORKLET_SOURCES } from "../worklet-hashes";

// Install the file in your public directory to avoid blob: and data: usage
const DEFAULT_WORKLET_URL = "/worklets/raw-audio-processor.worklet.js";

export const loadRawAudioProcessor = createWorkletModuleLoader(
  "raw-audio-processor",
  DEFAULT_WORKLET_URL,
  WORKLET_HASHES["raw-audio-processor"],
  WORKLET_SOURCES["raw-audio-processor"]
);
