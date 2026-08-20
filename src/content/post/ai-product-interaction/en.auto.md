---
title: "The Truly Missing Interaction Capability in AI Products: Interruption"
pubDate: 2026/08/20
tags:
  - AI
---

There's a problem that's easily overlooked when using AI products: Today, everyone discusses whether models can think more deeply, whether Agents can complete more complex tasks, and whether voice interaction will replace keyboards. However, as model capabilities continue to improve, the interaction structure at the product level has begun to seem outdated.

Most AI products today essentially still follow a very simple structure: **Input instruction → Model understanding → Start computation → Output result.**

If it's just asking ChatGPT a question, this model works fine. But when AI gradually transforms from a chat tool into an execution tool, the situation changes. Especially in scenarios like Agent, Coding Agent, and Deep Research, a single instruction might mean reading a large amount of context, searching for information, analyzing files, calling tools, modifying code, or even truly altering the external world. Once AI begins execution, it's no longer just "answering a sentence," but initiating a task with significant computational overhead and an increasingly long execution chain.

Yet, our interaction method remains very similar to traditional chatbots: send a sentence, then wait for it to finish.

I believe a very fundamental capability is missing here: **interruption.**

The interruption I'm referring to isn't the simple Stop button found in many AI products today. Stopping generation only terminates the current process, but it doesn't truly solve a more common problem: what should the system do if the user doesn't want to discard all previous content, but merely wishes to modify one condition during execution?

## Stop Does Not Equal Interruption

For example, I ask a Coding Agent to refactor a component:

> Migrate the data fetching for this page to React Query, keeping the existing UI and API unchanged.

The AI has already read the project structure, analyzed relevant components, located data request points, and understood the dependencies between components. Just as it's about to modify the code, I suddenly realize:

> Don't change UserPage itself, only adjust the data layer below it.

In human-to-human collaboration, this isn't an unusual situation. If I'm discussing a plan with a colleague, and the previous analysis is confirmed, I just need to add, "Don't touch UserPage, continue with the rest," and they will naturally preserve the work already done and adjust subsequent operations based on the new restriction.

However, many AI products today, when handling such situations, still lean towards a different logic: stop the current task, accept a new input, then re-understand the context, re-plan, and then continue execution.

Even if the model can still see the previous chat history, this isn't the same as truly "picking up where we left off." **Remembering what we just said and preserving the work state that was just completed are two different levels of problems.**

## AI Shouldn't Only Save Chat History

When we say an AI "has context" today, it usually refers to conversation context. What the user has said and what the model has replied can be carried into the next turn, so the model doesn't start over like it's the first meeting every time.

This kind of context solves the memory problem, but it doesn't fully solve the problem of computational reuse during execution.

Suppose an Agent, to complete a certain task, has already finished understanding requirements, scanning the project, locating relevant files, analyzing dependencies, identifying problem causes, and forming a preliminary modification plan. At this point, the user suddenly adds:

> Don't change the tests for now.

Only a part of the subsequent plan might be affected. The previous project scan hasn't changed, file relationships haven't changed, problem causes haven't changed, and even most of the plan still holds. In this situation, the more reasonable approach should be to preserve all previously valid results and only reprocess the parts affected by this new condition.

This is actually very similar to incremental computation, which is common in software development. Modifying one line of code in a large project doesn't mean everything must be recomputed from scratch; a change in one cell of a spreadsheet doesn't unconditionally recalculate all unrelated cells. The system determines which results have become invalid based on dependencies and then only recomputes the affected parts.

AI Agents should also possess similar capabilities.

If a complex task is viewed as a dependency graph, where requirement understanding influences the plan, the plan influences execution, and execution results in turn influence testing, then a user modifying a condition midway is essentially modifying one of these nodes. The system should then determine: which parts are still valid, which parts have become invalid, and which parts need to be recomputed, rather than treating the entire task as a new Prompt again.

This is also a step I believe AI products need to take forward: moving from conversation context to **execution state**.

The system should not only remember what the user has said but also know how far the task has progressed, which information has been verified, which judgments have been made, which results are still valid, and how subsequent steps were originally planned to be executed.

## Human Collaboration Is Not About Issuing Complete Instructions Once

This problem becomes even more apparent in voice interaction.

As AI voice capabilities continue to strengthen, operating computers directly through natural language has become a common product vision, but I've always had reservations about this interaction method. The problem isn't primarily whether voice recognition is accurate enough, but rather that in actual work, people rarely form a complete, unambiguous instruction that can be executed to completion in one go.

Human thought and collaboration processes are typically incremental.

We might first say, "Work on this plan," then, seeing the other person start, add, "Don't touch this part for now." A little later, discovering another issue, we might say, "The previous approach is fine, but let's try a different implementation here."

This iterative correction doesn't indicate a lack of expressive ability; it's inherently part of the work process. New information constantly emerges, and execution results can, in turn, alter human judgment, so collaboration itself requires continuous refinement.

If AI voice interaction is still built on a structure like "say a sentence → determine user has finished → start execution," then the more natural the voice, the more easily these structural problems will be exposed. Voice is a continuous input, while Agent execution is still segmented into discrete tasks; the two don't perfectly match.

A more reasonable approach is to view the entire collaboration process as a persistent task state. Each user input isn't necessarily creating a new task; often, it's merely modifying the current task state.

"Don't change this," "Keep the previous," "Do up to here for now," "This plan is wrong, revert to the previous one," "Continue"—these are all very natural in human collaboration. They aren't five unrelated commands, but rather continuous modifications to the same task.

Only if AI can understand user input in this manner will voice truly transform from a convenient input method into an interaction method suitable for complex collaboration.

## Interruption Shouldn't Just Be a Stop

Following this line of thought, what an AI Agent truly needs isn't a single, unified "stop," but rather several operations with completely different semantics.

The simplest is **Pause**. Pausing merely means the current execution stops for now, with the existing state remaining unchanged. The user might just want to see the progress, then confirm and continue.

Another is **Steer**. In this case, the user doesn't negate the previous work but merely adds new conditions to the current basis. For example, "Keep everything else the same, don't modify the public API." The system needs to determine which subsequent steps will be affected by this new condition and then locally adjust the execution plan.

Next is **Rollback**. If the user discovers that a previous step itself was wrong, they should be able to revert to a clear checkpoint, rather than having the AI "try to undo it" based on memory.

There's also **Branch**. If the previous analysis holds, but the user wants to compare an alternative path—for example, trying both React Query and Server Components based on the same architectural judgment—then the more natural approach should be to create two branches from the same state node, rather than copying the chat history and starting over.

Upon closer inspection, these concepts themselves are not new. Version control has branches and rollbacks, databases have transactions, IDEs have undo, compilation systems rely on dependency graphs, and operating systems maintain process states. Modern software systems have spent decades researching how complex states are modified, restored, and continued, yet in AI products, we often revert to the simplest model: give it a sentence, and hope it gets everything right from start to finish.

## Transaction Boundary Should Also Be Explicitly Designed

Of course, not all tasks can be infinitely interrupted or rolled back.

If the AI is merely analyzing files, generating drafts, or modifying local code, most operations are still within a reversible scope. But if it has already sent an email, submitted a transaction, deleted online data, or truly sent a request to an external system, the situation is entirely different. At this point, even if the user immediately says "wait," the system cannot pretend that changes already made in the real world don't exist.

Therefore, Agent products also need an equally important concept: **explicit transaction boundaries.**

A mature Agent should be able to clearly distinguish between thinking, planning, reversible execution, and irreversible execution, and provide a clear commit point before proceeding with irreversible operations. For example, an email draft is ready but not yet sent; code modifications are complete but not yet deployed; payment information is filled out but the transaction is not yet submitted.

These boundaries are not meant to add a confirmation pop-up for every step, but rather to let users clearly know the system's current state: what content can still be modified, which changes only require local recomputation, and which operations, once continued, will truly produce external side effects.

The stronger an Agent's execution capabilities, the more crucial this state determinism becomes. Otherwise, users will face a system that can do more and more things, but where it becomes increasingly difficult to determine "how far along the task actually is."

## Prompt Should No Longer Serve as a Task Boundary

Today, we are accustomed to viewing a Prompt as the most basic unit of interaction in AI products, with one Prompt corresponding to one Response. This is reasonable for chatbots, but as AI begins to undertake more complex, longer-duration work, this structure becomes increasingly strained.

The more suitable core unit should be a **Task**.

A Task can last minutes, hours, or even span multiple interactions, while a Prompt is merely a single input from the user for this Task. It might be creating a task, or it might be supplementing information, modifying constraints, querying status, or adjusting the execution direction.

In this way, the basic structure of AI products will also change. Today, it's more like:

**Prompt → Response**

Whereas in the future, a more reasonable structure should be:

**Task State + User Delta → State Update → Incremental Execution**

The model no longer faces a series of independent new requests, but rather continuously advances on the same persistent work state. Users also don't need to repeatedly re-describe unchanging background and constraints just because they've slightly altered their idea.

## AI Also Needs to Understand 'What Hasn't Changed'

There's also a frequently overlooked problem here.

Current AI products are adept at understanding what new information the user has added, but they aren't always good at stably inheriting the parts that haven't been modified.

For example, if I say:

> Change the release date from Thursday to Friday.

A normal human understanding is that only the release date has changed, while project content, responsible person, budget, and other timelines remain the same. However, in a Prompt-centric interaction structure, each new input might trigger the model to re-interpret the entire task. Consequently, users frequently add phrases like "don't touch anything else," "keep the previous format," "stick to the previous structure," or "only modify this section" to prevent the system from going off track.

The very commonness of these expressions in AI usage indicates that the system still lacks a very fundamental capability: **stable inheritance of unchanged state.**

A good collaborative system shouldn't require users to constantly re-maintain context. A more natural rule should be that existing states remain valid by default, unless the user explicitly modifies a specific part. Only then will "changing a little" truly be just changing a little, rather than reopening the entire task each time.

## More Important Than More Natural Voice Is Correctability

Currently, AI products place great emphasis on "human-like" aspects: more natural voices, lower latency, more realistic tone, richer emotional expression. These certainly have value, but if AI is placed in real collaborative scenarios, a more fundamental capability is actually allowing users to interrupt at any time and correctly understand what that interruption has changed.

The reason human-to-human collaboration feels natural isn't because we always articulate everything perfectly in one go, but because communication allows for continuous correction. I can change my mind mid-sentence, I can prompt the other person halfway through their work, agreed-upon content doesn't need re-explanation, new information only requires adjusting affected parts, a wrong approach can be reverted, and when comparison is needed, a different path can branch off from the same point.

These capabilities collectively form a kind of **correctability**.

However, many AI products are still very primitive in this regard. Models can already handle increasingly complex problems, but products still implicitly require users to think through all conditions as much as possible before starting a task and describe them completely through a sufficiently accurate Prompt.

This inherently conflicts with the value of Agents.

If all steps, boundaries, and exceptional cases of a complex problem can be fully defined before execution, then often what we need are automation scripts, not Agents. The advantage of AI lies precisely in its ability to handle vague, incomplete, and constantly changing problems, and to gradually form clearer solutions during execution.

Therefore, a mature AI product shouldn't rely on increasingly perfect Prompts, but rather allow users to start with an incomplete idea and continuously supplement, correct, and change direction during execution.

## From One-Time Execution to Continuous Collaboration

The next stage of interaction upgrades for AI products, worth paying attention to, may not be adding another input method, nor making voice sound more human-like. Compared to these superficial changes, AI needs to evolve further from a request-response tool into a **persistent, incremental, interruptible work environment.**

This environment needs to maintain task states, save checkpoints, understand dependencies between different steps, know which results can be reused, and which have become invalid due to new input; it should also allow users to pause, resume, rollback, and branch, and establish clear commit boundaries before truly producing external side effects.

Only then, when I say to an AI that is working:

> Wait, keep everything else the same, just change this one thing.

What it needs to understand is not just the sentence itself.

It should also know what "everything else" specifically refers to in terms of states, what "keep the same" means for which results can be reused, which subsequent steps this new condition will affect, and where to continue execution from.

When AI can handle this kind of continuous, modifiable, and recoverable collaborative relationship, it will truly break free from the chatbot logic of "one Prompt corresponds to one execution" and begin to become a computational tool that can participate in the work process long-term.

I believe this is the most crucial capability for AI products to add at the interaction level today.
