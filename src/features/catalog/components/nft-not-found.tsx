import { Link } from '@tanstack/react-router';

export function NftNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <title>NFT não encontrado · Kurio</title>
      <h1 className="text-[28px] font-bold">NFT não encontrado</h1>
      <p className="text-muted-foreground">Este NFT não existe ou foi removido.</p>
      <Link to="/" hash="mercado" className="text-highlight underline underline-offset-4">
        Explorar o mercado
      </Link>
    </section>
  );
}
