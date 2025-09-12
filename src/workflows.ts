import * as workflow from '@temporalio/workflow';

// Only import the activity types
import type * as activities from './activities';

// Load Activities and assign the Retry Policy
const { downloadAudio } = workflow.proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second', // amount of time that must elapse before the first retry occurs.
    maximumInterval: '1 minute', // maximum interval between retries.
    backoffCoefficient: 2, // how much the retry interval increases.
    maximumAttempts: 5, // maximum number of execution attempts. Unspecified means unlimited retries.
  },
  startToCloseTimeout: '1 minute', // maximum time allowed for a single Activity Task Execution.
});

const { transcribeCall, storeResults } = workflow.proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second', // amount of time that must elapse before the first retry occurs.
    maximumInterval: '1 minute', // maximum interval between retries.
    backoffCoefficient: 2, // how much the retry interval increases.
    maximumAttempts: 5, // maximum number of execution attempts. Unspecified means unlimited retries.
    nonRetryableErrorTypes: ['AuthenticationError'],
  },
  startToCloseTimeout: '1 minute', // maximum time allowed for a single Activity Task Execution.
});

const { summarizeTranscript } = workflow.proxyActivities<typeof activities>({
  retry: {
    initialInterval: '1 second', // amount of time that must elapse before the first retry occurs.
    maximumInterval: '1 minute', // maximum interval between retries.
    backoffCoefficient: 2, // how much the retry interval increases.
    maximumAttempts: 5, // maximum number of execution attempts. Unspecified means unlimited retries.
    nonRetryableErrorTypes: ['AuthenticationError', 'insufficient_quota'],
  },
  startToCloseTimeout: '1 minute', // maximum time allowed for a single Activity Task Execution.
});

// The Temporal Workflow.
// Just a TypeScript function.
export async function processCall(recordingSid: string): Promise<string> {

  try {
    const filePath = await downloadAudio(recordingSid);
    try {
        console.log(filePath);
        const transcript = await transcribeCall(filePath);
        console.log(transcript);
        try {
          const summary = await summarizeTranscript(transcript);
          console.log(summary);
          try {
            const storageResult = await storeResults(summary);
            return storageResult;
          } catch (e) {
            console.log("failed storage");
          }
        } catch (e) {
          console.log("failed summary");
        }
    } catch (e) {
      console.log("failed transcription");
    }
  } catch (e) {
    throw new workflow.ApplicationFailure("Failed to download audio");
  }
return("failed");
}