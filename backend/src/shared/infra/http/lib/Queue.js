// import '../database';

import Bee from 'bee-queue';
import redisConfig from '@config/redis';
// import Log from '../app/schemas/Log'

import AppError from '@shared/errors/AppError';
import SendWelcomeInvitationEmail from '../../../../modules/admin/users/jobs/SendWelcomeInvitationEmail';

// import '../../../container';

// import SendWelcomeInvitationEmailService from '@modules/users/services/SendWelcomeInvitationEmailService';
// import { container } from 'tsyringe';

// const providers = {
//   ethereal: container.resolve(EtherealMailProvider),
//   ses: container.resolve(SESMailProvider),
// };

const sendWelcome = SendWelcomeInvitationEmail;

const jobs = [sendWelcome];

// type QueueType = {
//   bee: Bee;
//   execute: any;
// };

/*
rror: Cannot inject the dependency at position #0 of "SendWelcomeInvitationEmailService" constructor. Reason:
    Attempted to resolve unregistered dependency token: "MailProvider
    */

class Queue {
  constructor() {
    this.queues = {};
    this.init();
  }

  init() {
    /* usando foreach pois não preciso retornar nada */
    jobs.forEach(({ key, execute }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          removeOnSuccess: true,
          redis: redisConfig,
        }),
        execute, // < = handle processa a fila, recebe as variaiveis
      };
    });
  }

  add(queue, job) {
    return this.queues[queue].bee.createJob(job).retries(3).save();
  }

  processQueue() {
    console.log(jobs);
    try {
      jobs.forEach(job => {
        const { bee, execute } = this.queues[job.key];
        bee.on('failed', this.handleFailure).process(execute);
        bee.on('progress', progress => {
          console.log(`Job ${job.id} reported progress: ${progress}%`);
        });
        bee.on('stalled', jobId => {
          console.log(`Job ${jobId} stalled and will be reprocessed`);
        });
        bee.on('succeeded', async result => {
          console.log(`Job ${result.id} success`);
          console.log(result);
        });
        bee.on('retrying', (job, err) => {
          console.log(
            `Job ${job.id} failed with error ${err.message} but is being retried!`,
          );
        });
      });
    } catch (err) {
      console.log(err);
      throw new AppError(err);
    }
  }

  async handleFailure(job, err) {
    console.log(`Queue FAILED`, err);
  }
}

export default new Queue();
