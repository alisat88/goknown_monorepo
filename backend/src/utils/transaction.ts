/*
 * Copyright (C) 2026 GoKnown LLC. All rights reserved.
 *
 * This software and documentation constitute an unpublished work and contain
 * valuable trade secrets and proprietary information belonging to GoKnown LLC.
 * None of this material may be copied, duplicated, or disclosed without the
 * express written permission of GoKnown LLC.
 */
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
