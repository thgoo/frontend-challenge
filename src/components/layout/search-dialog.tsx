import { useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useState, type SubmitEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function SearchDialog() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState('');

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setOpen(false);
    void navigate({ to: '/', search: { q: term.trim() || undefined }, hash: 'mercado' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Buscar NFTs">
          <Search aria-hidden="true" className="size-6" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Buscar NFTs</DialogTitle>
        <DialogDescription>Procure por nome, criador ou tag.</DialogDescription>
        <form role="search" onSubmit={submit} className="flex gap-2">
          <Input
            type="search"
            aria-label="Buscar NFTs"
            placeholder="Explorar coleções"
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
            }}
          />
          <Button type="submit">Buscar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
