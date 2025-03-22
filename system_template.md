TEMPLATE """{{- if .Messages }}
{{- if or .System .Tools }}<start_of_turn>user
{{- if .System}}
{{ .System }}
{{- end }}
{{- if .Tools }}
# Function Calling Instructions

You are provided with a set of functions to help complete tasks. Here are your instructions for using them:

1. FUNCTION DEFINITIONS
The available functions are defined within <tools></tools> XML tags below:

<tools>
{{- range $.Tools }}
{"type": "function", "function": {{ .Function }}}
{{- end }}
</tools>

2. FUNCTION CALLING FORMAT
When calling a function:
- Use ```tool_use``` code blocks
- Include both function name and arguments as a JSON object
- Follow this exact format:

```tool_use
{"name": "<function-name>", "arguments": <args-json-object>}
```

3. GUIDELINES
- Analyze the task carefully before choosing functions
- Only call functions that are necessary
- Validate all required arguments before calling
- Handle function responses appropriately
- Maintain context between function calls
- Chain multiple functions if needed to complete the task

4. ERROR HANDLING
- Validate argument types and formats
- Check for missing required arguments
- Handle function response errors gracefully
- Retry with different approaches if needed

5. RESPONSE FORMAT
- Always provide clear explanations of your actions
- Format responses in a clear, structured way
- Include relevant context from function responses
- End with clear next steps or conclusions

{{- end }}<end_of_turn>
{{ end }}
{{- range $i, $_ := .Messages }}
{{- $last := eq (len (slice $.Messages $i)) 1 -}}
{{- if eq .Role "user" }}<start_of_turn>user
{{ .Content }}<end_of_turn>
{{ else if eq .Role "assistant" }}<start_of_turn>model
{{ if .Content }}{{ .Content }}
{{- else if .ToolCalls }}```tool_use
{{ range .ToolCalls }}{"name": "{{ .Function.Name }}", "arguments": {{ .Function.Arguments}}}
{{ end }}```
{{- end }}{{ if not $last }}<end_of_turn>
{{ end }}
{{- else if eq .Role "tool" }}<start_of_turn>user
<tool_response>
{{ .Content }}
</tool_response><end_of_turn>
{{ end }}
{{- if and (ne .Role "assistant") $last }}<start_of_turn>model
{{ end }}
{{- end }}
{{- else }}
{{- if .System }}<start_of_turn>user
{{ .System }}<end_of_turn>
{{ end }}{{ if .Prompt }}<start_of_turn>user
{{ .Prompt }}<end_of_turn>
{{ end }}<start_of_turn>model
{{ end }}{{ .Response }}{{ if .Response }}<end_of_turn>{{ end }}"""