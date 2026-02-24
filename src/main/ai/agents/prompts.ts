export const VOICE_ANALYZER_SYSTEM = `You are an expert UX researcher analyzing a voice transcript from a user testing session. Extract structured insights about what the user was trying to do, their frustrations, what they called out as broken, and their emotional state throughout.`

export const VOICE_ANALYZER_PROMPT = (transcript: string) =>
  `Analyze this voice transcript from a testing session:\n\n${transcript}\n\nProvide:\n1. User intent summary\n2. Key frustrations\n3. Explicit bug callouts\n4. Emotional timeline (confused, frustrated, surprised, etc.)`

export const VIDEO_ANALYZER_SYSTEM = `You are a visual QA analyst examining screenshots from a testing session. Identify visual bugs, broken layouts, stuck loading states, error messages on screen, and how the UI changed between interactions.`

export const VIDEO_ANALYZER_PROMPT = (frameDescriptions: string) =>
  `Analyze these frame descriptions from a testing session video:\n\n${frameDescriptions}\n\nProvide a visual timeline describing what the user saw at each stage, noting any visual bugs or anomalies.`

export const NETWORK_ANALYZER_SYSTEM = `You are a backend/API debugging expert analyzing network request logs from a testing session. Identify failed requests, performance issues, patterns in failures, and whether the request sequence is logical.`

export const NETWORK_ANALYZER_PROMPT = (networkJson: string) =>
  `Analyze this network log from a testing session:\n\n${networkJson}\n\nProvide:\n1. Failed requests and likely causes\n2. Performance bottlenecks\n3. Failure patterns (repeated endpoints, CORS, auth issues)\n4. Request sequence anomalies`

export const CONSOLE_ANALYZER_SYSTEM = `You are a frontend debugging expert analyzing console output from a testing session. Identify errors, their relationships, what stack traces reveal, and the overall health of the application.`

export const CONSOLE_ANALYZER_PROMPT = (consoleJson: string) =>
  `Analyze this console output from a testing session:\n\n${consoleJson}\n\nProvide:\n1. Errors and their meanings\n2. Error relationships (causal chains)\n3. Stack trace insights\n4. Warning significance\n5. Overall application health`

export const INTERACTION_ANALYZER_SYSTEM = `You are a UX analyst examining a recorded sequence of user interactions. Identify the workflow the user attempted, where it broke down, retry patterns, confusing paths, and wait times.`

export const INTERACTION_ANALYZER_PROMPT = (interactionsJson: string) =>
  `Analyze this interaction recording from a testing session:\n\n${interactionsJson}\n\nProvide:\n1. Workflow the user was completing\n2. Where the workflow broke down\n3. Retry patterns (indicating failures)\n4. Confusing navigation paths\n5. Significant wait times`

export const SYNTHESIZER_SYSTEM = `You are a senior QA engineer writing the definitive bug report for a testing session. You have analysis from 5 specialized agents. Weave their findings into a single coherent story with a clear title, severity, steps to reproduce, root cause analysis, and evidence citations. Write in markdown.`

export const SYNTHESIZER_PROMPT = (analyses: {
  voice?: string
  video?: string
  network: string
  console: string
  interactions: string
}) => `
Combine these analyses into a comprehensive bug report:

## Voice Analysis
${analyses.voice || 'No voice recording available'}

## Video Analysis
${analyses.video || 'No video analysis available'}

## Network Analysis
${analyses.network}

## Console Analysis
${analyses.console}

## Interaction Analysis
${analyses.interactions}

Write a markdown bug report with:
- Clear descriptive title
- Severity (Critical/High/Medium/Low)
- 2-3 sentence executive summary
- Steps to reproduce (plain English)
- Expected vs actual behavior
- Technical root cause analysis connecting all evidence
- Specific evidence citations (URLs, status codes, error messages with file:line, timestamps)
- Suggested fix if determinable
- User quotes if voice analysis is available
`
