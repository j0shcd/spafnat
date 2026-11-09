/** Offline helper. Passwords enter through a hidden terminal prompt or stdin, never argv. */
import { stdin, stderr } from 'node:process';
import { hashPassword } from '../functions/lib/password';

async function readPassword(): Promise<string> {
  if (process.argv.length !== 2) throw new Error('N’indiquez pas le mot de passe dans la commande. Utilisez la saisie masquée ou l’entrée standard.');
  const terminal = Boolean(stdin.isTTY);
  if (terminal) {
    stdin.setRawMode(true);
    stderr.write('Mot de passe administrateur (saisie masquée) : ');
  }
  stdin.setEncoding('utf8');
  try {
    return await new Promise<string>((resolve, reject) => {
      let password = '';
      const finish = (error?: Error) => {
        stdin.removeListener('data', onData);
        stdin.removeListener('end', onEnd);
        stdin.removeListener('error', onError);
        stdin.pause();
        if (error) reject(error); else resolve(password.replace(/\r?\n$/, ''));
      };
      const onEnd = () => finish();
      const onError = () => finish(new Error('Lecture du mot de passe impossible'));
      const onData = (chunk: string) => {
        for (const char of chunk) {
          if (terminal && (char === '\u0003' || char === '\u0004')) {
            finish(new Error('Saisie annulée')); return;
          }
          if (terminal && (char === '\r' || char === '\n')) { finish(); return; }
          if (terminal && (char === '\u007f' || char === '\b')) password = [...password].slice(0, -1).join('');
          else password += char;
          if (Buffer.byteLength(password, 'utf8') > 1024) {
            finish(new Error('Mot de passe trop long (maximum 1 024 octets)')); return;
          }
        }
      };
      stdin.on('data', onData);
      stdin.on('end', onEnd);
      stdin.on('error', onError);
    });
  } finally {
    if (terminal) { stdin.setRawMode(false); stderr.write('\n'); }
  }
}

async function main() {
  const password = await readPassword();
  if (password.length < 16) throw new Error('Choisissez un mot de passe unique d’au moins 16 caractères, conservé dans votre gestionnaire de mots de passe.');
  console.log(`ADMIN_PASSWORD_HASH=${await hashPassword(password)}`);
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : 'Création de l’empreinte impossible');
  process.exitCode = 1;
});
