import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/profile')({
  component: () => <h1 className="px-4 py-8 text-3xl font-semibold">Profile</h1>,
});
