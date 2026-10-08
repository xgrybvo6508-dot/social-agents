import type { AgentClient } from '../../agent/client';
import type { Settings } from '../../agent/settings';
import type { SocialDatabase } from '../../memory/db';

export type ModeViewDeps = {
  database: SocialDatabase;
  agent: AgentClient;
  getSettings: () => Settings;
  liveRegion: HTMLElement;
};
