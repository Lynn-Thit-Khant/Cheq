# Agent Behavioral Rules

- **Consultation Mode**: If the prompt includes any discussion trigger (such as "discuss", "thoughts?", "what do you think?", "review", "opinion", "brainstorm", "compare", "option"), DO NOT edit or modify the code. Only provide thoughts, analysis, visual options, or suggestions.
- **Execution Mode**: If the prompt asks to "implement", "build", "fix", "update", or "add" something without a discussion trigger, edit the local code as requested but DO NOT commit or push to Git unless explicitly instructed to do so.
- **UI & Design**: Whenever you need to build or modify UI components, refer to and strictly follow the design guidelines in `c:\Users\Lynn\cheq\.agents\design.md`. Use the `view_file` tool to read it if you haven't already.
