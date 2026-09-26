import {html} from 'lit';
import {customElement} from 'lit/decorators.js';
import {AIUXElement} from '@servicenow/aiux/aiux-components-core';
import {i18n} from '@servicenow/aiux/aiux-services';
import '@servicenow/aiux/aiux-components-chat';

// Declaring the Build Agent scope here is what makes its skills reachable:
// the chat stamps this onto every turn as `meta.applications`, which the
// skill allowlist is matched against. Without it Build Agent stays invisible.
const APPLICATIONS = ['x_snc_forecast_v_0', 'sn_build_agent'];

@customElement('wdf-build-agent-chat')
export class WdfBuildAgentChat extends AIUXElement {
  render() {
    return html`
      <section class="flex flex-col gap-3">
        <h3 class="text-2xl font-semibold text-text-primary">
          ${i18n.getMessage('Ask Otto to build it')}
        </h3>
        <p class="text-base leading-relaxed text-text-secondary">
          ${i18n.getMessage(
            'Describe what you need and Otto can create it for you with Build Agent.'
          )}
        </p>
        <div class="h-[32rem] rounded-xl border border-base-300">
          <sn-aiux-chat-wrapper
            class="block h-full w-full"
            .applications=${APPLICATIONS}
            .showPromotedTopics=${true}
          ></sn-aiux-chat-wrapper>
        </div>
      </section>
    `;
  }
}
