# 11. 反模式防护

## 一、什么是 Agent 反模式

Agent 在执行任务时可能陷入各种有害的行为模式。这些不是程序 Bug，而是 LLM 决策的系统性缺陷：

- **Doom Loop（厄运循环）**：Agent 反复调用同一工具，使用相同参数，陷入无限循环
- **Cascading Failure（级联失败）**：一个错误导致一系列错误的补救尝试，每次尝试都让情况更糟
- **Tool Abuse（工具滥用）**：Agent 过度使用某个工具（如每轮都搜索，即使信息已经足够）
- **Premature Execution（过早执行）**：Agent 在信息不充分时就开始执行破坏性操作
- **Confirmation Bias（确认偏误）**：Agent 只收集支持其假设的证据，忽略反面证据

反模式防护就是在 Runtime 层面检测并打断这些有害模式。

## 二、Doom Loop 检测

### 2.1 什么是 Doom Loop

```
Agent: I'll help you fix the bug. Let me check the logs.
  [Tool Call: read_file("/var/log/app.log")]
  [Result: Error - File not found]

Agent: Let me try a different log location.
  [Tool Call: read_file("/var/log/app.log")]   ← 相同的工具，相同的参数
  [Result: Error - File not found]

Agent: Maybe the logs are in a different place.
  [Tool Call: read_file("/var/log/app.log")]   ← 再次相同！
  [Result: Error - File not found]
```

Agent 陷入了循环：它认为每次都在尝试不同的方案，但实际上参数完全相同。

### 2.2 Doom Loop 检测算法

```
class DoomLoopDetector:
    history: List<ToolCall>         // 当前 Turn 中的工具调用历史
    threshold: Integer              // 触发阈值（如 3 次）

    function detect(toolCall: ToolCall): DoomLoopResult:
        // 查找历史中的相似调用
        similarCalls = history.filter(call ->
            call.name == toolCall.name and
            call.arguments == toolCall.arguments
        )

        if similarCalls.length >= threshold - 1:
            return DoomLoopResult {
                detected: true,
                pattern: "identical_repeated_call",
                repeatedCount: similarCalls.length + 1,
                suggestedAction: "Ask user for guidance or try a different approach"
            }

        // 检测近似循环（参数略有不同但本质相同）
        if isSemanticallySimilar(toolCall, history.last(3)):
            return DoomLoopResult {
                detected: true,
                pattern: "semantic_loop",
                repeatedCount: similarCalls.length + 1,
                suggestedAction: "Suggest alternative approaches"
            }

        return DoomLoopResult { detected: false }

    function isSemanticallySimilar(toolCall: ToolCall, recentCalls: List<ToolCall>): Boolean:
        // 示例：连续读取同一目录下的不同文件
        if toolCall.name == "read_file":
            paths = recentCalls.map(c -> c.arguments.path)
            if allPathsInSameDirectory(paths) and paths.length >= 3:
                return true

        // 示例：连续搜索相似关键词
        if toolCall.name == "search":
            queries = recentCalls.map(c -> c.arguments.query)
            if areQueriesSemanticallySimilar(queries) and queries.length >= 3:
                return true

        return false
```

### 2.3 Doom Loop 的干预策略

当检测到 Doom Loop 时，Runtime 应该：

```
function handleDoomLoop(detection: DoomLoopResult, context: TurnContext):
    // 1. 阻断当前工具调用
    emitEvent("doom_loop_detected", detection)

    // 2. 向 Agent 注入干预提示
    interventionMessage = createSystemMessage({
        content: "Warning: You have called '" + context.toolCall.name +
                 "' " + detection.repeatedCount + " times with the same or similar arguments. " +
                 "This suggests you may be stuck in a loop. " +
                 "Please try a fundamentally different approach, or ask the user for clarification.",
        visibility: "internal"
    })
    context.session.messages.append(interventionMessage)

    // 3. 可选：触发用户确认
    if detection.repeatedCount >= 5:
        approvalRequest = createApprovalRequest({
            description: "Agent appears to be stuck in a loop. Allow it to continue?",
            riskLevel: "high"
        })
        decision = await requestUserApproval(approvalRequest)
        if not decision.approved:
            cancelTurn(context.turn)
```

## 三、级联失败防护

### 3.1 级联失败的典型场景

```
1. Agent 尝试修改文件 A → 失败（权限不足）
2. Agent 尝试用 sudo 修改 → 失败（没有 sudo 权限）
3. Agent 尝试复制文件到临时目录再修改 → 失败（磁盘空间不足）
4. Agent 尝试删除其他文件腾出空间 → 失败（那些文件也受保护）
5. ... 不断恶化
```

### 3.2 级联失败检测

```
class CascadingFailureDetector:
    failureStreak: Integer = 0
    maxFailureStreak: Integer = 3
    lastToolCategories: List<String>

    function onToolResult(result: ToolResult):
        if result.isError:
            failureStreak += 1

            if failureStreak >= maxFailureStreak:
                return DetectionResult {
                    detected: true,
                    pattern: "cascading_failure",
                    description: failureStreak + " consecutive tool failures",
                    suggestedAction: "Pause and ask user for guidance"
                }
        else:
            failureStreak = 0   // 成功则重置计数

        return DetectionResult { detected: false }
```

### 3.3 级联失败的干预

```
function handleCascadingFailure(detection: DetectionResult, context: TurnContext):
    // 1. 暂停当前 Turn
    pauseTurn(context.turn)

    // 2. 向用户报告
    emitEvent("cascading_failure_alert", {
        failureCount: detection.failureStreak,
        lastErrors: context.session.lastToolResults.map(r -> r.errorMessage)
    })

    // 3. 注入系统提示，引导 Agent 改变策略
    context.session.addInternalMessage(TextPart {
        content: "Multiple consecutive failures detected. " +
                 "Instead of trying more workarounds, " +
                 "please summarize what you've learned and ask the user for help."
    })
```

## 四、工具滥用检测

### 4.1 滥用模式

| 模式 | 说明 | 检测方法 |
|------|------|----------|
| **搜索滥用** | 每轮都搜索，即使已有足够信息 | 统计搜索工具调用频率 |
| **文件扫描** | 无差别读取大量文件 | 监控读取文件数量和范围 |
| **命令试探** | 尝试大量不同的命令参数 | 监控命令执行的多样性 |
| **API 轰炸** | 对外部 API 发起过多请求 | 监控网络请求频率 |

### 4.2 频率限制器

```
class ToolRateLimiter:
    limits: Map<String, RateLimit>   // toolName -> limit

    struct RateLimit:
        maxCallsPerTurn: Integer
        maxCallsPerMinute: Integer
        cooldownAfterExcessiveUse: Integer  // 冷却时间（毫秒）

    function checkLimit(toolCall: ToolCall): LimitResult:
        limit = limits[toolCall.name]
        if limit == null:
            return LimitResult { allowed: true }

        // 检查 Turn 内调用次数
        turnUsage = getTurnUsage(toolCall.name)
        if turnUsage >= limit.maxCallsPerTurn:
            return LimitResult {
                allowed: false,
                reason: "Tool '" + toolCall.name + "' has been called " +
                        turnUsage + " times in this turn. Limit: " + limit.maxCallsPerTurn
            }

        // 检查时间窗口内调用次数
        recentUsage = getRecentUsage(toolCall.name, windowMs: 60000)
        if recentUsage >= limit.maxCallsPerMinute:
            return LimitResult {
                allowed: false,
                reason: "Rate limit exceeded for '" + toolCall.name +
                        "'. Please wait before trying again."
            }

        return LimitResult { allowed: true }
```

## 五、权限提升检测

Agent 可能尝试通过多次请求逐步获得更高权限：

```
// 检测模式：Agent 被拒绝后尝试变体
1. execute_command("rm file.txt") → DENIED
2. execute_command("sudo rm file.txt") → DENIED
3. execute_command("bash -c 'rm file.txt'") → DENIED
4. execute_command("python -c 'import os; os.remove(\"file.txt\")'") → DETECTED!
```

```
class PrivilegeEscalationDetector:
    deniedPatterns: List<String>

    function detect(toolCall: ToolCall, lastDecision: Decision): Boolean:
        if lastDecision != DENY:
            return false

        // 检查当前调用是否是之前被拒绝调用的变体
        for deniedPattern in deniedPatterns:
            if isVariantOf(toolCall, deniedPattern):
                return true

        return false

    function isVariantOf(toolCall: ToolCall, deniedPattern: String): Boolean:
        // 使用语义相似性检测
        // 例如：不同的命令实现相同的功能
        currentIntent = extractIntent(toolCall)
        deniedIntent = extractIntent(deniedPattern)
        return semanticSimilarity(currentIntent, deniedIntent) > 0.9
```

## 六、运行时干预框架

### 6.1 统一干预接口

```
interface AntiPatternGuard:
    function analyze(toolCall: ToolCall, context: TurnContext): GuardResult
    function getPriority(): Integer

struct GuardResult:
    triggered: Boolean
    pattern: String
    severity: "low" | "medium" | "high" | "critical"
    action: "allow" | "warn" | "block" | "ask_user"
    message: String           // 给 Agent 的提示信息
    userMessage: String       // 给用户的消息（如果需要）
```

### 6.2 Guard 注册与执行

```
class GuardRegistry:
    guards: List<AntiPatternGuard>

    function register(guard: AntiPatternGuard):
        guards.append(guard)
        guards.sortByDescending(g -> g.getPriority())

    function evaluate(toolCall: ToolCall, context: TurnContext): GuardDecision:
        for guard in guards:
            result = guard.analyze(toolCall, context)
            if result.triggered:
                return GuardDecision {
                    action: result.action,
                    pattern: result.pattern,
                    severity: result.severity,
                    message: result.message
                }

        return GuardDecision { action: "allow" }
```

### 6.3 内置 Guards

```
// 注册所有内置防护
registry.register(DoomLoopDetector { threshold: 3 })
registry.register(CascadingFailureDetector { maxFailureStreak: 3 })
registry.register(ToolRateLimiter { limits: {
    "search": { maxCallsPerTurn: 5, maxCallsPerMinute: 10 },
    "read_file": { maxCallsPerTurn: 20, maxCallsPerMinute: 60 },
    "execute_command": { maxCallsPerTurn: 10, maxCallsPerMinute: 30 }
}})
registry.register(PrivilegeEscalationDetector {})
registry.register(ExcessiveOutputDetector { maxOutputLength: 100000 })
```

## 七、最佳实践

1. **防护是建议性的，不是绝对安全的**：Guard 可以减少问题，但不能替代权限系统和沙箱
2. **避免过度防护**：太严格的防护会干扰正常的 Agent 行为（如合理的多次尝试）
3. **给用户控制权**：允许用户查看和调整防护规则（如提高阈值、关闭特定 Guard）
4. **学习模式**：新 Agent 可以先用宽松的防护，根据实际行为数据调整阈值
5. **记录所有触发**：每次 Guard 触发都应该记录，用于分析和改进
6. **区分 "警告" 和 "阻断"**：有些模式只需要警告 Agent（让它自我修正），有些需要直接阻断
7. **上下文感知**：同样的行为在不同上下文中可能意义不同（如批量处理文件时多次 `read_file` 是正常的）
