# Build Agent in the WDF Lab AIUX chat — where things stand

Last updated 2026-09-25. Instance `demoalectriallwfaa158438`, Brazil release. Lab app scope `x_snc_forecast_v_0` (Forecast Variance).

## The goal

A lab user opens an exercise page, types into the Otto chat on that page, and Otto can actually build things by calling Build Agent (the app that Autonomous Engineer installs and sits on top of).

## What is confirmed working

These were each checked against the live instance, not assumed.

- Build Agent is installed, in the scope `sn_build_agent`, application record "Build Agent (Trial)" version 2.6.4.
- The Build Agent skill config record opens normally now. The "Security constraints prevent access" error recorded in the 22 September session no longer happens, so that old dead end is gone.
- The agent "Studio Skills Assistant" (`8ee51e2047630bd4037d0fadf26d43f8`) exists and has all three Build Agent tools attached and active: Build Agent, Build Agent Preprocessor, BA Glide Tools Metadata Summarizer. Its published version is committed and active. Its source of truth is `src/fluent/agents/studio-skills-assistant.now.ts` in this repo.
- The runtime will let that agent call Build Agent. A direct run of the use case produced an access verification task that passed with `isAccessAllowed: true` on the Build Agent tool itself. This is the single most important result so far: permission to call Build Agent from an agent is not the problem.
- The lab chat channel is wired correctly. `aiux.json` points at channel `cc8ad3fb475f0394037d0fadf26d43db`, which resolves to the deployment "WDF Lab Otto Deployment" (`5848d2e047a30bd4037d0fadf26d4355`), and that deployment is active.

## What I created this session, all inside our own scope

- `sn_nowassist_skill_config` `4a2bdaa547a7cb10037d0fadf26d43fc` — registers the Studio Skills Assistant agent as an invokable skill. Copied the shape of the working "ATF troubleshooting agent" record.
- `sn_nowassist_skill_config_status` `6b0c962947e7cb10037d0fadf26d43e3` — the active status row that the above needs.
- `sn_aia_team` `914c126d3b27c710a0db3141a3e45afe` ("Studio Skills") and one member row `7e4c9ead3b27c710a0db3141a3e45a1b` putting our agent on that team.
- `sn_aia_usecase` `e85c5ee547e7cb10037d0fadf26d4306` ("Build Agent Studio Skills"), pointing at that team. This is what makes the agent reachable by Otto's router at all, because the router selects use cases, not agents.
- `sys_cs_context_profile` `640e52a93be7c710a0db3141a3e45a98` ("WDF Lab Otto") and `sys_now_assist_deployment_config` `78fd5e6d476bcb10037d0fadf26d4331` linking it to the lab deployment. The lab deployment had no config row at all before this, which is why it had no promoted items and nothing to configure.

Two records I created and then deleted again: a `sys_gen_ai_skill` row and a promoted-skill row. The name and description fields on `sys_gen_ai_skill` are computed by the platform and would not accept values from the API, so the row came out hollow, showed as a nameless promoted item, and most likely caused the hard error the chat threw at that point. Promoting a skill properly needs to happen through the Now Assist admin interface, which fills those fields itself.

No standard or out-of-box records were modified.

## App-side changes in this repo

- `widgets/build-agent-chat.js` is a new panel that mounts `sn-aiux-chat-wrapper` and declares `applications: ['x_snc_forecast_v_0', 'sn_build_agent']`.
- That panel is added near the bottom of all seven exercise pages under `pages/exercises/`.
- `application.js` now has `features.chat: false`, so the old nav-bar chat is gone and there is only one chat on the page.
- Both changes are built, deployed and installed on the instance.

The reason the panel declares `applications` at all: the AIUX chat stamps that list onto every chat turn as `meta.applications`, and the skill allowlist is matched against it. The nav-bar chat never sets it, so anything outside the default set stays invisible. This is documented in the chat wrapper source and in the AIUX agent pack reference for `sn-aiux-chat-wrapper`.

## What is still blocking it

Every chat turn that goes to the instance lands on a use case called "Default VA Workflow" (`802d751eff942210d09effffffffff73`) and hangs there. Its orchestrator task sits at "Ongoing" and never finishes, which is what produces the "I'm having trouble processing your request right now" message. That workflow has around seventy-five agents on its team, which is almost certainly why it never completes. It hung the same way when tested from the platform's own Otto panel, so this is not something the lab app caused.

Our use case never gets selected instead. The likely reason is the system property `sn_aia.conversational_workflows`, which lists exactly two use case sys_ids — the hanging default and one other — and ours is not among them. That property is instance-wide, so I stopped rather than edit it.

The other route is to skip Otto's router completely and have the lab panel call Build Agent's own REST API, which does exist and is fairly complete: create conversation, append message, read messages, create and execute plans, under `/api/sn_build_agent/build_agent_api` and `/api/sn_build_agent/v1`. Basic authentication is refused by that API with an authentication error, and the ACL guarding it requires the role `sn_glider.admin`, which the admin user does not currently hold. The API's description says it is for the Build Agent extension to talk to the instance, and it exposes OAuth token endpoints, so it probably expects a bearer token rather than basic auth.

## Honest state of the two options

Neither is proven, and this matters because a lot of time was lost this session to confident guesses.

- Adding our use case to `sn_aia.conversational_workflows` might make the router pick it, but that was never tested, and the fallback workflow would still be broken for everything else.
- Granting `sn_glider.admin` might not help at all, because the error seen was about authentication rather than permission.

## The cheapest next test

Call one of the Build Agent API endpoints from inside the running lab app in a logged-in browser, using the AIUX fetch helper so the call carries the normal session. That tells us whether a session is enough for that API, costs no configuration changes, and decides whether the direct-API route is viable before anyone touches a shared property or a role.
