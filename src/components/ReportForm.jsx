import { useState } from 'react';
import { api } from '../lib/api.js';
import { useApp, useT } from '../store/app.jsx';
import { Button, Field, Modal, inputClass } from './ui.jsx';

export default function ReportForm({ open, onClose, targetType, targetId }) {
  const t = useT();
  const app = useApp();
  const [topic, setTopic] = useState('other');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api('/tickets', { method: 'POST', body: { targetType, targetId, topic, body } });
      app.notify(t('reportSent'));
      setBody('');
      onClose();
    } catch {
      app.notify(t('serverError'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={t('reportTitle')} onClose={onClose}>
      <p className="mb-3 text-sm text-mute">{t('reportHint')}</p>
      <Field label={t('topic')}>
        <select className={inputClass()} value={topic} onChange={(e) => setTopic(e.target.value)}>
          {['late', 'quality', 'fake_kitchen', 'rude', 'other'].map((key) => (
            <option key={key} value={key}>
              {t(`topics.${key}`)}
            </option>
          ))}
        </select>
      </Field>
      <div className="mt-3">
        <Field label={t('reportBody')}>
          <textarea className={`${inputClass()} min-h-24`} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <Button onClick={submit} disabled={busy || body.trim().length < 4}>
          {t('report')}
        </Button>
      </div>
    </Modal>
  );
}
