import { getManager } from 'typeorm';

const MAX_RETRIES = 3;

export async function transactionWithRetry(work: any) {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      return await getManager().transaction(async transactionManager => {
        // Executa a função de trabalho com o gerenciador de transações
        return await work(transactionManager);
      });
    } catch (error: any) {
      if (error.code === '40P01') {
        // Código de erro para deadlock
        attempt++;
        console.warn(
          `Deadlock detected, retrying... (${attempt}/${MAX_RETRIES})`,
        );
        if (attempt >= MAX_RETRIES) {
          throw new Error('Excedido o número de tentativas devido ao deadlock');
        }
      } else {
        // Se não for um deadlock, lança o erro normalmente
        throw error;
      }
    }
  }
}
