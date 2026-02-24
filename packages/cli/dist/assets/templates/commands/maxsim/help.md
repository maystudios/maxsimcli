---
name: maxsim:help
description: Show available MAXSIM commands and usage guide
---
<objective>
Display the complete MAXSIM command reference.

Output ONLY the reference content below. Do NOT add:
- Project-specific analysis
- Git status or file context
- Next-step suggestions
- Any commentary beyond the reference
</objective>

<execution_context>
@./workflows/help.md
</execution_context>

<process>
Output the complete MAXSIM command reference from @./workflows/help.md.
Display the reference content directly — no additions or modifications.
</process>
