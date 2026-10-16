import React, { useState } from 'react';
import { accountClient } from '../../accountSession.js';
import type { ModelConfig } from '../../brain/cognitiveModel.js';
export function AccountBrainTest({ model }: { model: ModelConfig }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [prompt, setPrompt] = useState('Suggest one safe action for an NPC who sees an unfamiliar visitor.');
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [answer, setAnswer] = useState('');
  async function signIn() {
    setBusy(true); setNotice('');
    try {
      const client = await accountClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setSignedIn(true); setPassword('');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Sign-in failed.'); }
    finally { setBusy(false); }
  }
  async function test() {
    setBusy(true); setNotice(''); setAnswer('');
    try {
      const client = await accountClient();
      const { data } = await client.auth.getSession();
      if (!data.session?.access_token) { setSignedIn(false); throw new Error('Sign in to test your account provider.'); }
      const response = await fetch('/api/account/reason', { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, modelConfig: model }) });
      const result = await response.json();
      if (!response.ok || !result?.content) throw new Error(result?.error || 'Account provider test failed.');
      setAnswer(result.content);
      setNotice(`Response from ${result.provider} (${result.model}). Advice only; no NPC action was executed.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Provider request failed.'); }
    finally { setBusy(false); }
  }
  return <div className="npc-config-card">
    <h4>Test your account provider</h4><p>This sends a real AI request using your centrally saved key. It consumes one account request allowance; your provider may charge for model usage. Local cognition simulation stays separate.</p>
    {!signedIn && <><label className="npc-form-row"><span>Email</span><input type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} /></label><label className="npc-form-row"><span>Password</span><input type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} /></label><button type="button" disabled={busy || !email || !password} onClick={() => void signIn()}>Sign in to AI WONDERLAND</button></>}
    {signedIn && <><label className="npc-form-row"><span>Test prompt</span><textarea maxLength={4000} value={prompt} onChange={event => setPrompt(event.target.value)} /></label><button type="button" disabled={busy || !prompt.trim()} onClick={() => void test()}>{busy ? 'Requesting…' : 'Run provider test'}</button><button type="button" disabled={busy} onClick={() => void accountClient().then(async client => { await client.auth.signOut(); setSignedIn(false); setAnswer(''); })}>Sign out</button></>}
    {notice && <p role="status">{notice}</p>}{answer && <pre style={{ whiteSpace: 'pre-wrap' }}>{answer}</pre>}
  </div>;
}
