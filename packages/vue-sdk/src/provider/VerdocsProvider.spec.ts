import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';
import type { VerdocsEndpoint } from '@verdocs/js-sdk';
import { useResolvedEndpoint, useVerdocs } from './useVerdocs';
import VerdocsProvider from './VerdocsProvider.vue';
import { TEST_API_BASE } from '../test/support';

describe('VerdocsProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('supplies its endpoint to descendants', () => {
    let injected: VerdocsEndpoint | undefined;
    const Probe = defineComponent({
      setup() {
        injected = useVerdocs().endpoint;
        return () => h('div');
      },
    });

    mount(VerdocsProvider, {
      props: { baseUrl: TEST_API_BASE },
      slots: { default: Probe },
    });

    expect(injected?.getBaseURL()).toBe(TEST_API_BASE);
  });

  it('names the fix when no provider exists and no override is passed', () => {
    const Probe = defineComponent({
      setup() {
        useResolvedEndpoint();
        return () => h('div');
      },
    });

    expect(() => mount(Probe)).toThrowError(/VerdocsProvider/);
  });
});
