export const isDemo = process.env.EXPO_PUBLIC_JORNADA_DEMO === '1' && typeof document !== 'undefined';

declare global {
  interface Window {
    jornadaDemoFetch?: typeof fetch;
  }
}

let boot: Promise<typeof fetch> | undefined;

function loadAdapter() {
  return new Promise<typeof fetch>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = '/demo/adapter.mjs';
    script.onload = () => {
      if (window.jornadaDemoFetch) resolve(window.jornadaDemoFetch);
      else reject(new Error('Demonstração indisponível'));
    };
    script.onerror = () => { script.remove(); reject(new Error('Demonstração indisponível')); };
    document.head.appendChild(script);
  });
}

export const demoFetch: typeof fetch = async (input, init) => {
  boot ??= loadAdapter().catch((error) => {
    boot = undefined;
    throw error;
  });
  return (await boot)(input, init);
};
