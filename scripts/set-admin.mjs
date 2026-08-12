// Script utilitário para cadastrar (ou remover) administradores diretamente
// via Firebase Admin SDK, sem passar pelas regras do Firestore.
// Necessário para criar o PRIMEIRO admin (depois disso, admins já
// cadastrados podem adicionar outros pela própria tela do painel em
// /admin/configuracoes).
//
// Uso:
//   1. Baixe a chave da service account em:
//      Firebase Console > Configurações do projeto > Contas de serviço
//      > Gerar nova chave privada
//   2. Salve o arquivo como "serviceAccountKey.json" na raiz do projeto
//      (já está no .gitignore, não sobe pro git nem pra Vercel).
//   3. Rode:
//        node scripts/set-admin.mjs add seuemail@gmail.com
//        node scripts/set-admin.mjs remove seuemail@gmail.com
//        node scripts/set-admin.mjs list

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const keyPath = join(__dirname, "..", "serviceAccountKey.json");

if (!existsSync(keyPath)) {
  console.error(
    "\n[ERRO] Não encontrei 'serviceAccountKey.json' na raiz do projeto.\n" +
      "Baixe em: Firebase Console > Configurações do projeto > Contas de serviço\n" +
      "> Gerar nova chave privada, e salve o arquivo com esse nome exato.\n"
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const [, , action, emailArg] = process.argv;

async function main() {
  if (action === "list") {
    const snap = await db.collection("admins").get();
    if (snap.empty) {
      console.log("Nenhum admin cadastrado ainda.");
      return;
    }
    console.log("Admins cadastrados:");
    snap.forEach((doc) => console.log(" -", doc.id));
    return;
  }

  if (!emailArg) {
    console.error(
      "Uso: node scripts/set-admin.mjs <add|remove|list> [email@dominio.com]"
    );
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();

  if (action === "add") {
    await db.collection("admins").doc(email).set({
      email,
      addedAt: new Date().toISOString(),
      addedBy: "set-admin-script",
    });
    console.log(`✅ "${email}" agora é administrador.`);
  } else if (action === "remove") {
    await db.collection("admins").doc(email).delete();
    console.log(`✅ "${email}" removido da lista de administradores.`);
  } else {
    console.error(
      "Uso: node scripts/set-admin.mjs <add|remove|list> [email@dominio.com]"
    );
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
