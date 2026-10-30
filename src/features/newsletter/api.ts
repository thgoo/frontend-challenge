import type { NewsletterInput } from '@/contracts/newsletter';
import { http } from '@/lib/http';

export async function subscribe(input: NewsletterInput) {
  await http.post('/newsletter', input);
}
