import { AgentError } from '../../agent/errors';
import type { AgentClient } from '../../agent/client';
import {
  PROVIDERS,
  applyPreset,
  clearApiKey,
  maskApiKey,
  saveSettings,
  type ProviderId,
  type Settings,
} from '../../agent/settings';
import { createButton } from '../components/button';
import { createSelect, createTextInput, fieldGroup } from '../components/field';
import { createNotice } from '../components/notice';
import { announce, backLink, el } from '../dom';

export type SettingsViewDeps = {
  agent: AgentClient;
  getSettings: () => Settings;
  storage: Storage;
  liveRegion: HTMLElement;
  onSaved?: () => void;
};

export const renderSettings = (container: HTMLElement, deps: SettingsViewDeps): void => {
  container.append(backLink());
  const intro = el('p', {
    className: 'page-intro',
    text: 'Provider settings stay in this browser only. They are never included in memory export.',
  });
  container.append(intro);

  let draft = { ...deps.getSettings() };
  const feedback = el('div');
  container.append(feedback);

  const providerSelect = createSelect(
    'settings-provider',
    PROVIDERS.map((p) => ({ value: p.id, label: p.label })),
    draft.provider,
  );
  providerSelect.addEventListener('change', () => {
    draft = applyPreset(providerSelect.value as ProviderId, draft);
    baseUrlInput.value = draft.baseUrl;
    modelInput.value = draft.model;
  });

  const baseUrlInput = createTextInput('settings-base-url', {
    value: draft.baseUrl,
    autocomplete: 'off',
  });
  const modelInput = createTextInput('settings-model', { value: draft.model, autocomplete: 'off' });
  const keyInput = createTextInput('settings-api-key', {
    type: 'password',
    autocomplete: 'off',
    placeholder: 'Paste API key',
  });

  const masked = el('p', {
    className: 'field-hint',
    text: `Saved key: ${maskApiKey(draft.apiKey)}`,
  });

  container.append(
    fieldGroup('Provider preset', providerSelect),
    fieldGroup('Base URL', baseUrlInput, 'HTTPS required except localhost.'),
    fieldGroup('Model', modelInput),
    fieldGroup('API key', keyInput),
    masked,
  );

  const showFeedback = (message: string, tone: 'info' | 'error' = 'info'): void => {
    feedback.replaceChildren(createNotice(message, tone === 'error' ? 'error' : 'info'));
    announce(deps.liveRegion, message);
  };

  const readDraft = (): Settings => ({
    ...draft,
    baseUrl: baseUrlInput.value.trim().replace(/\/+$/, ''),
    model: modelInput.value.trim(),
    apiKey: keyInput.value.length > 0 ? keyInput.value.trim() : draft.apiKey,
  });

  const actions = el('div', { className: 'page-actions' });
  actions.append(
    createButton('Save settings', {
      variant: 'primary',
      onClick: () => {
        try {
          draft = saveSettings(deps.storage, readDraft());
          keyInput.value = '';
          masked.textContent = `Saved key: ${maskApiKey(draft.apiKey)}`;
          showFeedback('Settings saved.');
          deps.onSaved?.();
        } catch {
          showFeedback('Settings could not be saved. Check the fields.', 'error');
        }
      },
    }),
    createButton('Clear key', {
      onClick: () => {
        draft = clearApiKey(deps.storage, readDraft());
        keyInput.value = '';
        masked.textContent = `Saved key: ${maskApiKey(draft.apiKey)}`;
        showFeedback('API key cleared.');
      },
    }),
    createButton('Test connection', {
      onClick: () => {
        const toTest = readDraft();
        void deps.agent.testConnection(toTest).then(
          () => showFeedback('Connection succeeded.'),
          (error: unknown) => {
            const message = error instanceof AgentError ? error.message : 'Connection test failed.';
            showFeedback(message, 'error');
          },
        );
      },
    }),
  );
  container.append(actions);
};
