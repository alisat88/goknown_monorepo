import { IChecksumDTO } from '../dtos/IChecksumDTO';

export default interface IChecksumProvider {
  generate(data: IChecksumDTO): Promise<string>;
}
