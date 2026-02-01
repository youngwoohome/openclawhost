import { loadSchema } from '@/lib/schema-loader';
import { WizardClient } from './WizardClient';

export default function Home() {
  // Load schema on the server
  const schema = loadSchema();

  return <WizardClient schema={schema} />;
}
